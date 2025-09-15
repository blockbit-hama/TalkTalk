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

/**
 * 지갑 생성 시 서버에 계정 자동 등록
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
    // Mock 친구 검색 (실제로는 서버 API 호출)
    console.log('전화번호로 친구 검색:', phoneNumber);

    // 시뮬레이션된 친구 데이터
    const mockFriend = {
      id: `friend_${Date.now()}`,
      name: '친구',
      phoneNumber,
      xrplAddress: `r${Math.random().toString(36).substr(2, 24)}`,
      isRegistered: true
    };

    return {
      success: true,
      friend: mockFriend
    };
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