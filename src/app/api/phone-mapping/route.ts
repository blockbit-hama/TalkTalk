import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { xrplManagerV2 } from '../../../lib/xrpl/xrpl-manager-v2';

// Redis 전용 사용자 프로필 저장소 (전화번호 기반)
interface UserProfile {
  phoneNumber: string;           // 사용자 ID (전화번호)
  userName: string;              // 사용자 이름
  walletAddress: string;         // XRPL 지갑 주소
  privateKey?: string;           // 개인키 (서명용)
  publicKey?: string;            // 공개키
  seed?: string;                 // 시드 구문
  assets?: {
    xrp: {
      balance: string;           // XRP 잔액
      address: string;           // XRPL 주소
    };
    tokens: Array<{
      currency: string;           // 토큰 코드
      issuer: string;             // 발행자 주소
      balance: string;            // 잔액
      trustline?: boolean;        // 트러스트라인 설정 여부
    }>;
  };
  isOnline: boolean;             // 온라인 상태
  lastSeen: string;             // 마지막 접속 시간
  createdAt: string;            // 계정 생성 시간
  updatedAt: string;            // 마지막 업데이트 시간
}

// KV 연결 상태 확인
const isKVAvailable = () => {
  return process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;
};

// 사용자 프로필 저장 함수 - Redis 전용
async function saveUserProfile(userProfile: UserProfile): Promise<void> {
  if (!isKVAvailable()) {
    throw new Error('Redis 연결 정보가 없습니다. KV_REST_API_URL과 KV_REST_API_TOKEN을 확인하세요.');
  }

  try {
    await kv.set(`user:${userProfile.phoneNumber}`, userProfile);
    console.log(`✅ Redis에 사용자 프로필 저장: ${userProfile.phoneNumber}`);
  } catch (error) {
    console.error('❌ Redis 저장 실패:', error);
    throw new Error(`Redis 저장 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// 사용자 프로필 조회 함수 - Redis 전용
async function getUserProfile(phoneNumber: string): Promise<UserProfile | null> {
  if (!isKVAvailable()) {
    throw new Error('Redis 연결 정보가 없습니다. KV_REST_API_URL과 KV_REST_API_TOKEN을 확인하세요.');
  }

  try {
    const profile = await kv.get<UserProfile>(`user:${phoneNumber}`);
    if (profile) {
      console.log(`📞 Redis에서 사용자 프로필 조회 성공: ${phoneNumber}`);
    }
    return profile;
  } catch (error) {
    console.error('❌ Redis 조회 실패:', error);
    throw new Error(`Redis 조회 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// 모든 사용자 프로필 조회 (디버그용) - Redis 전용
export async function getAllUserProfiles(): Promise<Array<[string, UserProfile]>> {
  if (!isKVAvailable()) {
    throw new Error('Redis 연결 정보가 없습니다. KV_REST_API_URL과 KV_REST_API_TOKEN을 확인하세요.');
  }

  try {
    const keys = await kv.keys('user:*');
    const profiles: Array<[string, UserProfile]> = [];

    for (const key of keys) {
      const profile = await kv.get<UserProfile>(key);
      if (profile) {
        const phoneNumber = key.replace('user:', '');
        profiles.push([phoneNumber, profile]);
      }
    }

    console.log(`📞 Redis에서 모든 사용자 프로필 조회 완료: ${profiles.length}개`);
    return profiles;
  } catch (error) {
    console.error('❌ Redis 전체 조회 실패:', error);
    throw new Error(`Redis 전체 조회 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// 기존 호환성을 위한 함수
export async function getAllMappings(): Promise<Array<[string, any]>> {
  const profiles = await getAllUserProfiles();
  return profiles.map(([phone, profile]) => [phone, {
    phoneNumber: profile.phoneNumber,
    walletAddress: profile.walletAddress,
    userName: profile.userName,
    createdAt: profile.createdAt,
  }]);
}

// 사용자 등록 (표준 예제 기반)
export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, userName } = await request.json();

    console.log('👤 표준 방식 사용자 등록 요청:', { phoneNumber, userName });

    // 입력 검증
    if (!phoneNumber || !userName) {
      return NextResponse.json(
        { error: '전화번호와 이름이 필요합니다.' },
        { status: 400 }
      );
    }

    // 전화번호 형식 검증
    const cleanPhoneNumber = phoneNumber.replace(/[-\s]/g, '');
    if (!/^01[0-9]{8,9}$/.test(cleanPhoneNumber)) {
      return NextResponse.json(
        { error: '올바른 전화번호 형식이 아닙니다. (010-XXXX-XXXX)' },
        { status: 400 }
      );
    }

    // 표준 방식으로 새 지갑 생성
    console.log('🔑 표준 방식으로 새 지갑 생성 중...');
    const walletInfo = await xrplManagerV2.createNewWallet();
    
    console.log('✅ 새 지갑 생성 완료:', {
      address: walletInfo.address,
      seed: walletInfo.seed?.substring(0, 10) + '...',
      publicKey: walletInfo.publicKey?.substring(0, 10) + '...'
    });

    // 이름 검증
    if (userName.trim().length < 1 || userName.trim().length > 20) {
      return NextResponse.json(
        { error: '이름은 1~20자 사이여야 합니다.' },
        { status: 400 }
      );
    }

    // 이미 등록된 사용자인지 확인하고 제거
    const existingUser = await getUserProfile(cleanPhoneNumber);
    if (existingUser) {
      console.log(`🔄 기존 사용자 덮어쓰기: ${cleanPhoneNumber} (${existingUser.userName})`);

      // 기존 사용자의 친구 관계도 정리 (friends API에서 관리되는 데이터)
      try {
        // friends:phoneNumber 키로 저장된 친구 관계 제거
        await kv.del(`friends:${cleanPhoneNumber}`);
        console.log(`🗑️ 친구 관계 데이터 제거: friends:${cleanPhoneNumber}`);

        // 다른 사용자들의 친구 목록에서도 제거
        const friendKeys = await kv.keys('friends:*');
        for (const key of friendKeys) {
          if (key !== `friends:${cleanPhoneNumber}`) {
            const friendRelationships = await kv.get<Array<any>>(key);
            if (friendRelationships && Array.isArray(friendRelationships)) {
              const updatedRelationships = friendRelationships.filter(friend =>
                friend.friendPhone !== cleanPhoneNumber
              );

              if (friendRelationships.length !== updatedRelationships.length) {
                await kv.set(key, updatedRelationships);
                console.log(`🗑️ ${key}에서 ${cleanPhoneNumber} 제거`);
              }
            }
          }
        }
      } catch (error) {
        console.error('❌ 친구 관계 정리 실패:', error);
      }
    }

    // 표준 방식 사용자 프로필 생성
    const userProfile: UserProfile = {
      phoneNumber: cleanPhoneNumber,
      userName: userName.trim(),
      walletAddress: walletInfo.address,
      privateKey: walletInfo.seed,     // 시드를 개인키로 사용 (표준 방식)
      publicKey: walletInfo.publicKey, // 공개키 포함
      seed: walletInfo.seed,           // 시드 포함
      assets: {
        xrp: {
          balance: '0', // 초기 잔액 0
          address: walletInfo.address,
        },
        tokens: [],
      },
      isOnline: true,
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Redis에 사용자 프로필 저장
    await saveUserProfile(userProfile);

    console.log('✅ 사용자 등록 완료:', cleanPhoneNumber);

    return NextResponse.json({
      success: true,
      message: '표준 방식으로 사용자가 성공적으로 등록되었습니다.',
      user: {
        phoneNumber: userProfile.phoneNumber,
        userName: userProfile.userName,
        walletAddress: userProfile.walletAddress,
        publicKey: userProfile.publicKey,
        seed: userProfile.seed,
        isOnline: userProfile.isOnline,
        createdAt: userProfile.createdAt,
      },
      wallet: {
        address: walletInfo.address,
        seed: walletInfo.seed,
        publicKey: walletInfo.publicKey
      },
      storage: 'Redis',
      method: 'Standard XRPL Wallet Generation'
    });

  } catch (error) {
    console.error('❌ 사용자 등록 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 사용자 정보 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get('phoneNumber');
    const walletAddress = searchParams.get('walletAddress');
    const search = searchParams.get('search');

    console.log('👤 사용자 조회 요청:', { phoneNumber, walletAddress, search });

    if (search) {
      // 사용자 검색
      const allProfiles = await getAllUserProfiles();
      const users = allProfiles
        .filter(([phone, profile]) => 
          profile.userName.toLowerCase().includes(search.toLowerCase()) ||
          profile.phoneNumber.includes(search) ||
          profile.walletAddress.toLowerCase().includes(search.toLowerCase())
        )
        .map(([phone, profile]) => ({
          phoneNumber: profile.phoneNumber,
          userName: profile.userName,
          walletAddress: profile.walletAddress,
          isOnline: profile.isOnline,
          lastSeen: profile.lastSeen,
        }));

      return NextResponse.json({
        success: true,
        users: users,
        count: users.length,
        storage: 'Redis'
      });
    }

    // 전화번호 또는 지갑주소 중 하나는 필요
    if (!phoneNumber && !walletAddress) {
      return NextResponse.json(
        { error: '전화번호 또는 지갑주소가 필요합니다.' },
        { status: 400 }
      );
    }

    let profile = null;

    if (phoneNumber) {
      // 전화번호로 조회
      const cleanPhoneNumber = phoneNumber.replace(/[-\s]/g, '');
      console.log('🧹 정리된 전화번호:', cleanPhoneNumber);
      profile = await getUserProfile(cleanPhoneNumber);

      if (!profile) {
        console.log('❌ 사용자를 찾을 수 없음:', cleanPhoneNumber);
        return NextResponse.json(
          { error: '해당 사용자를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
    } else if (walletAddress) {
      // 지갑주소로 역조회
      console.log('🔍 지갑주소로 역조회:', walletAddress);
      const allProfiles = await getAllUserProfiles();

      for (const [phone, userProfile] of allProfiles) {
        if (userProfile.walletAddress === walletAddress) {
          profile = userProfile;
          break;
        }
      }

      if (!profile) {
        console.log('❌ 지갑주소를 찾을 수 없음:', walletAddress);
        return NextResponse.json(
          { error: '해당 지갑주소를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
    }

    console.log('👤 사용자 조회 성공:', profile.phoneNumber);

    return NextResponse.json({
      success: true,
      user: {
        phoneNumber: profile.phoneNumber,
        userName: profile.userName,
        walletAddress: profile.walletAddress,
        privateKey: profile.privateKey, // 개인키 포함
        publicKey: profile.publicKey,   // 공개키 포함
        seed: profile.seed,            // 시드 포함
        assets: profile.assets,
        isOnline: profile.isOnline,
        lastSeen: profile.lastSeen,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
      storage: 'Redis'
    });

  } catch (error) {
    console.error('❌ 사용자 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 개발용: 모든 매핑 조회
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const debug = searchParams.get('debug');

    if (debug === 'list') {
      const allMappings = await getAllMappings();
      const formattedMappings = allMappings.map(([phone, data]) => ({
        phoneNumber: phone,
        walletAddress: data.walletAddress,
        userName: data.userName,
        createdAt: data.createdAt,
      }));

      return NextResponse.json({
        success: true,
        count: allMappings.length,
        mappings: formattedMappings,
        storage: 'Redis'
      });
    }

    return NextResponse.json(
      { error: 'Invalid operation' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ 디버그 요청 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}