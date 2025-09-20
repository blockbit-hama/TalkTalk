// 서버 등록 API 관련 함수들

interface ServerRegistrationRequest {
  walletId: string;
  walletName: string;
  xrplAddress: string;
  phoneNumber?: string;
  timestamp: string;
}

interface ServerRegistrationResponse {
  success: boolean;
  accountId?: string;
  message?: string;
  error?: string;
}

// 새로운 사용자 등록 인터페이스 (간소화)
interface UserRegistrationRequest {
  userId: string;
  addresses: Record<string, string>;
  phoneNumber?: string | null;
  userName?: string | null;
  enabledAssets: any[];
  timestamp: string;
}

interface UserRegistrationResponse {
  success: boolean;
  userId?: string;
  message?: string;
  error?: string;
}

/**
 * 새로운 사용자 등록 시스템
 */
export async function registerUserToServer(
  userData: Omit<UserRegistrationRequest, 'timestamp'>
): Promise<UserRegistrationResponse> {
  try {
    const registrationData: UserRegistrationRequest = {
      ...userData,
      timestamp: new Date().toISOString()
    };

    console.log('🆔 새로운 사용자 등록 중:', {
      userId: registrationData.userId,
      walletId: registrationData.walletId,
      masterAddress: registrationData.masterAddress,
      addresses: Object.keys(registrationData.addresses),
      enabledAssets: registrationData.enabledAssets.length
    });

    // Redis에 사용자 정보 저장
    try {
      const { kv } = await import('@vercel/kv');
      
      // 사용자 기본 정보 저장 (UUID 기반)
      await kv.set(`user:${registrationData.userId}`, {
        userId: registrationData.userId, // UUID
        addresses: registrationData.addresses,
        phoneNumber: registrationData.phoneNumber,
        userName: registrationData.userName,
        enabledAssets: registrationData.enabledAssets,
        createdAt: registrationData.timestamp,
        lastUpdated: registrationData.timestamp
      });

      // 지갑 주소로 사용자 ID 매핑 저장 (확장성 고려)
      const mainAddress = registrationData.addresses.XRP;
      await kv.set(`address_to_user:${mainAddress}`, registrationData.userId);

      // 각 자산 주소도 매핑 저장
      for (const [asset, address] of Object.entries(registrationData.addresses)) {
        await kv.set(`address_to_user:${address}`, registrationData.userId);
        await kv.set(`user_asset:${registrationData.userId}:${asset}`, address);
      }

      console.log('✅ 사용자 정보 Redis 저장 완료');
    } catch (redisError) {
      console.error('❌ Redis 저장 실패:', redisError);
    }

    // 시뮬레이션된 서버 응답
    const mockResponse: UserRegistrationResponse = {
      success: true,
      userId: registrationData.userId,
      message: '사용자가 성공적으로 등록되었습니다.'
    };

    // localStorage에 등록 정보 저장
    const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    existingUsers.push({
      ...registrationData,
      userId: mockResponse.userId
    });
    localStorage.setItem('registeredUsers', JSON.stringify(existingUsers));

    return mockResponse;
  } catch (error) {
    console.error('사용자 등록 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    };
  }
}

/**
 * 사용자 전화번호 등록/업데이트
 */
export async function registerUserPhone(
  userId: string,
  phoneNumber: string,
  userName: string
): Promise<UserRegistrationResponse> {
  try {
    console.log('📞 사용자 전화번호 등록 중:', { userId, phoneNumber, userName });

    // Redis에 전화번호 매핑 저장
    try {
      const { kv } = await import('@vercel/kv');
      
      // 사용자 정보 업데이트
      const userInfo = await kv.get(`user:${userId}`);
      if (userInfo) {
        const updatedUserInfo = {
          ...userInfo,
          phoneNumber: phoneNumber,
          userName: userName,
          lastUpdated: new Date().toISOString()
        };
        await kv.set(`user:${userId}`, updatedUserInfo);
      }

      // 전화번호 매핑 저장
      await kv.set(`phone:${phoneNumber}`, {
        phoneNumber: phoneNumber,
        walletAddress: userInfo?.addresses?.XRP || '',
        userName: userName,
        userId: userId,
        createdAt: new Date().toISOString()
      });

      // 전화번호로 사용자 ID 매핑 저장
      await kv.set(`phone_to_user:${phoneNumber}`, userId);

      console.log('✅ 전화번호 등록 Redis 저장 완료');
    } catch (redisError) {
      console.error('❌ Redis 저장 실패:', redisError);
    }

    return {
      success: true,
      userId: userId,
      message: '전화번호가 성공적으로 등록되었습니다.'
    };
  } catch (error) {
    console.error('전화번호 등록 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    };
  }
}

/**
 * 지갑 생성 시 서버에 계정 자동 등록 (기존 함수)
 */
export async function registerWalletToServer(
  walletId: string,
  walletName: string,
  xrplAddress: string,
  phoneNumber?: string
): Promise<ServerRegistrationResponse> {
  try {
    const registrationData: ServerRegistrationRequest = {
      walletId,
      walletName,
      xrplAddress,
      phoneNumber,
      timestamp: new Date().toISOString()
    };

    // Mock 서버 등록 (실제로는 서버 API 호출)
    console.log('서버에 지갑 등록 중:', registrationData);

    // 시뮬레이션된 서버 응답
    const mockResponse: ServerRegistrationResponse = {
      success: true,
      accountId: `acc_${Date.now()}`,
      message: '지갑이 성공적으로 등록되었습니다.'
    };

    // localStorage에 등록 정보 저장
    const existingRegistrations = JSON.parse(localStorage.getItem('serverRegistrations') || '[]');
    existingRegistrations.push({
      ...registrationData,
      accountId: mockResponse.accountId,
      registeredAt: new Date().toISOString()
    });
    localStorage.setItem('serverRegistrations', JSON.stringify(existingRegistrations));

    return mockResponse;
  } catch (error) {
    console.error('서버 등록 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '서버 등록 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 전화번호로 친구 검색 (서버에서)
 */
export async function searchFriendByPhone(phoneNumber: string): Promise<{
  success: boolean;
  friend?: {
    id: string;
    name: string;
    phoneNumber: string;
    xrplAddress: string;
    isRegistered: boolean;
  };
  error?: string;
}> {
  try {
    console.log('📞 전화번호로 친구 검색:', phoneNumber);

    // URL 생성 확인
    const searchUrl = `/api/phone-mapping?phoneNumber=${encodeURIComponent(phoneNumber)}`;
    console.log('🔗 요청 URL:', searchUrl);

    // 실제 서버 API 호출
    const response = await fetch(searchUrl);
    console.log('📡 응답 상태:', response.status, response.statusText);

    const result = await response.json();
    console.log('📄 응답 데이터:', result);

    if (response.ok && result.success) {
      // 서버에서 찾은 친구 정보
      const friend = {
        id: `friend_${Date.now()}`,
        name: result.userName || '친구', // 서버에서 받은 실제 이름 사용
        phoneNumber: result.phoneNumber,
        xrplAddress: result.walletAddress,
        isRegistered: true
      };

      console.log('✅ 친구 찾기 성공:', friend);
      return {
        success: true,
        friend
      };
    } else {
      // 서버에서 찾지 못한 경우
      console.log('❌ 해당 전화번호의 사용자를 찾을 수 없습니다:', result.error);
      return {
        success: false,
        error: result.error || '해당 전화번호로 등록된 사용자를 찾을 수 없습니다.'
      };
    }
  } catch (error) {
    console.error('친구 검색 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '친구 검색 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 친구 추가 시 서버에 친구 관계 등록
 */
export async function registerFriendToServer(
  userId: string,
  friendId: string,
  friendPhoneNumber: string
): Promise<ServerRegistrationResponse> {
  try {
    const friendData = {
      userId,
      friendId,
      friendPhoneNumber,
      timestamp: new Date().toISOString()
    };

    console.log('서버에 친구 관계 등록:', friendData);

    // Mock 서버 응답
    const mockResponse: ServerRegistrationResponse = {
      success: true,
      message: '친구가 성공적으로 추가되었습니다.'
    };

    return mockResponse;
  } catch (error) {
    console.error('친구 등록 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '친구 등록 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 전송 완료 시 서버에 트랜잭션 기록
 */
export async function recordTransactionToServer(
  fromAddress: string,
  toAddress: string,
  amount: string,
  currency: string,
  transactionHash: string,
  friendId?: string
): Promise<ServerRegistrationResponse> {
  try {
    const transactionData = {
      fromAddress,
      toAddress,
      amount,
      currency,
      transactionHash,
      friendId,
      timestamp: new Date().toISOString()
    };

    console.log('서버에 트랜잭션 기록:', transactionData);

    // Mock 서버 응답
    const mockResponse: ServerRegistrationResponse = {
      success: true,
      message: '트랜잭션이 성공적으로 기록되었습니다.'
    };

    return mockResponse;
  } catch (error) {
    console.error('트랜잭션 기록 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '트랜잭션 기록 중 오류가 발생했습니다.'
    };
  }
}