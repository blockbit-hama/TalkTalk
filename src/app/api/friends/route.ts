import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { getAllMappings } from '../phone-mapping/route';

// 사용자 프로필 인터페이스
interface UserProfile {
  phoneNumber: string;
  userName: string;
  walletAddress: string;
  assets?: {
    xrp: {
      balance: string;
      address: string;
    };
    tokens: Array<{
      currency: string;
      issuer: string;
      balance: string;
      trustline?: boolean;
    }>;
  };
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}

// 친구 관계 저장소
interface FriendRelationship {
  userId: string; // 사용자 ID (보통 지갑 주소)
  friendId: string;
  friendName: string;
  friendPhone: string;
  friendAddress: string;
  isOnline: boolean;
  lastSeen: Date;
  createdAt: string;
}

// KV 연결 상태 확인
const isKVAvailable = () => {
  return process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;
};

// 사용자 프로필 조회 함수
async function getUserProfile(phoneNumber: string): Promise<UserProfile | null> {
  if (!isKVAvailable()) {
    throw new Error('Redis 연결 정보가 없습니다.');
  }

  try {
    const profile = await kv.get<UserProfile>(`user:${phoneNumber}`);
    return profile;
  } catch (error) {
    console.error('❌ 사용자 프로필 조회 실패:', error);
    throw new Error(`사용자 프로필 조회 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// 친구 관계 저장 함수 - Redis 전용
async function saveFriendRelationships(userId: string, relationships: FriendRelationship[]): Promise<void> {
  if (!isKVAvailable()) {
    throw new Error('Redis 연결 정보가 없습니다. KV_REST_API_URL과 KV_REST_API_TOKEN을 확인하세요.');
  }

  try {
    await kv.set(`friends:${userId}`, relationships);
    console.log(`✅ Redis에 친구 관계 저장: ${userId} (${relationships.length}개)`);
  } catch (error) {
    console.error('❌ Redis 저장 실패:', error);
    throw new Error(`Redis 저장 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// 친구 관계 조회 함수 - Redis 전용
async function getFriendRelationships(userId: string): Promise<FriendRelationship[]> {
  if (!isKVAvailable()) {
    throw new Error('Redis 연결 정보가 없습니다. KV_REST_API_URL과 KV_REST_API_TOKEN을 확인하세요.');
  }

  try {
    const relationships = await kv.get<FriendRelationship[]>(`friends:${userId}`);
    console.log(`📖 Redis에서 친구 관계 조회: ${userId} (${relationships?.length || 0}개)`);
    return relationships || [];
  } catch (error) {
    console.error('❌ Redis 조회 실패:', error);
    throw new Error(`Redis 조회 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// 모든 친구 관계 조회 (디버그용) - KV 우선, 실패 시 로컬 메모리 사용
async function getAllFriendRelationships(): Promise<Array<[string, FriendRelationship[]]>> {
  try {
    if (isKVAvailable()) {
      const keys = await kv.keys('friends:*');
      const relationships: Array<[string, FriendRelationship[]]> = [];

      for (const key of keys) {
        const userRelationships = await kv.get<FriendRelationship[]>(key);
        if (userRelationships) {
          const userId = key.replace('friends:', '');
          relationships.push([userId, userRelationships]);
        }
      }

      console.log(`📖 KV에서 모든 친구 관계 조회 완료: ${relationships.length}개 사용자`);
      return relationships;
    } else {
      const relationships: Array<[string, FriendRelationship[]]> = [];
      for (const [userId, userRelationships] of localFriendRelationships) {
        relationships.push([userId, userRelationships]);
      }
      console.log(`📖 로컬 메모리에서 모든 친구 관계 조회 완료: ${relationships.length}개 사용자`);
      return relationships;
    }
  } catch (error) {
    console.error('❌ KV 전체 조회 실패, 로컬 메모리 사용:', error);
    const relationships: Array<[string, FriendRelationship[]]> = [];
    for (const [userId, userRelationships] of localFriendRelationships) {
      relationships.push([userId, userRelationships]);
    }
    console.log(`📖 로컬 메모리에서 모든 친구 관계 조회 완료 (fallback): ${relationships.length}개 사용자`);
    return relationships;
  }
}

// 사용자의 친구 목록 조회 (전화번호 기반)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userPhone = searchParams.get('userPhone');

    if (!userPhone) {
      return NextResponse.json(
        { error: '사용자 전화번호가 필요합니다.' },
        { status: 400 }
      );
    }

    const cleanUserPhone = userPhone.replace(/[-\s]/g, '');
    
    // 전화번호 형식 검증
    if (!/^01[0-9]{8,9}$/.test(cleanUserPhone)) {
      return NextResponse.json(
        { error: '올바른 전화번호 형식이 아닙니다. (010-XXXX-XXXX)' },
        { status: 400 }
      );
    }

    // 사용자 존재 확인
    const userProfile = await getUserProfile(cleanUserPhone);
    if (!userProfile) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 해당 사용자의 친구 목록 조회 (KV)
    const userFriends = await getFriendRelationships(cleanUserPhone);

    return NextResponse.json({
      success: true,
      friends: userFriends.map(friend => ({
        phoneNumber: friend.friendPhone,
        userName: friend.friendName,
        walletAddress: friend.friendAddress,
        isOnline: friend.isOnline,
        lastSeen: friend.lastSeen,
        createdAt: friend.createdAt,
      })),
      count: userFriends.length,
      user: {
        phoneNumber: userProfile.phoneNumber,
        userName: userProfile.userName,
        isOnline: userProfile.isOnline,
      },
      storage: 'Redis'
    });

  } catch (error) {
    console.error('❌ 친구 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 친구 관계 추가 (전화번호 기반)
export async function POST(request: NextRequest) {
  try {
    const {
      userPhone,
      friendPhone,
      nickname
    } = await request.json();

    console.log('👥 친구 추가 요청:', { userPhone, friendPhone, nickname });

    // 입력 검증
    if (!userPhone || !friendPhone) {
      return NextResponse.json(
        { error: '사용자 전화번호와 친구 전화번호가 필요합니다.' },
        { status: 400 }
      );
    }

    // 전화번호 형식 검증
    const cleanUserPhone = userPhone.replace(/[-\s]/g, '');
    const cleanFriendPhone = friendPhone.replace(/[-\s]/g, '');

    if (!/^01[0-9]{8,9}$/.test(cleanUserPhone) || !/^01[0-9]{8,9}$/.test(cleanFriendPhone)) {
      return NextResponse.json(
        { error: '올바른 전화번호 형식이 아닙니다. (010-XXXX-XXXX)' },
        { status: 400 }
      );
    }

    // 자기 자신을 친구로 추가하는 것 방지
    if (cleanUserPhone === cleanFriendPhone) {
      return NextResponse.json(
        { error: '자기 자신을 친구로 추가할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 사용자 존재 확인
    const userProfile = await getUserProfile(cleanUserPhone);
    if (!userProfile) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다. 먼저 회원가입을 해주세요.' },
        { status: 404 }
      );
    }

    // 친구 사용자 존재 확인
    const friendProfile = await getUserProfile(cleanFriendPhone);
    if (!friendProfile) {
      return NextResponse.json(
        { error: '해당 전화번호로 등록된 사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 사용자의 기존 친구 목록 가져오기 (KV)
    const userFriends = await getFriendRelationships(cleanUserPhone);

    // 이미 친구인지 확인
    const existingFriend = userFriends.find(friend =>
      friend.friendPhone === cleanFriendPhone
    );

    if (existingFriend) {
      return NextResponse.json(
        { error: '이미 친구로 등록된 사용자입니다.' },
        { status: 409 }
      );
    }

    // 새 친구 관계 생성
    const newFriendship: FriendRelationship = {
      userId: cleanUserPhone,
      friendId: cleanFriendPhone,
      friendName: friendProfile.userName,
      friendPhone: cleanFriendPhone,
      friendAddress: friendProfile.walletAddress,
      isOnline: friendProfile.isOnline,
      lastSeen: new Date(friendProfile.lastSeen),
      createdAt: new Date().toISOString()
    };

    // 1. 현재 사용자를 친구 목록에 추가
    userFriends.push(newFriendship);
    await saveFriendRelationships(cleanUserPhone, userFriends);

    // 2. 상대방에게도 나를 친구로 추가 (양방향 관계 생성)
    console.log('\n=== 양방향 친구 관계 생성 시작 ===');
    try {
      // 상대방의 친구 목록에 현재 사용자를 추가
      const friendFriends = await getFriendRelationships(cleanFriendPhone);

      // 상대방 친구 목록에서 나를 이미 친구로 가지고 있는지 확인
      const existingReverseFriend = friendFriends.find(friend =>
        friend.friendPhone === cleanUserPhone
      );

      if (!existingReverseFriend) {
        const reverseFriendship: FriendRelationship = {
          userId: cleanFriendPhone, // 상대방이 주인
          friendId: cleanUserPhone, // 나를 친구로
          friendName: userProfile.userName, // 상대방이 나를 부를 이름
          friendPhone: cleanUserPhone,
          friendAddress: userProfile.walletAddress,
          isOnline: userProfile.isOnline,
          lastSeen: new Date(userProfile.lastSeen),
          createdAt: new Date().toISOString()
        };

        friendFriends.push(reverseFriendship);
        await saveFriendRelationships(cleanFriendPhone, friendFriends);
        console.log(`✅ 양방향 친구 관계 생성 완료: ${userProfile.userName} → ${friendProfile.userName}`);
      } else {
        console.log('이미 양방향 친구 관계가 존재합니다.');
      }
    } catch (error) {
      console.error('양방향 친구 관계 생성 실패:', error);
    }

    return NextResponse.json({
      success: true,
      message: '친구가 성공적으로 추가되었습니다.',
      friend: {
        phoneNumber: newFriendship.friendPhone,
        userName: newFriendship.friendName,
        walletAddress: newFriendship.friendAddress,
        isOnline: newFriendship.isOnline,
        lastSeen: newFriendship.lastSeen,
        nickname: nickname || newFriendship.friendName,
      },
      storage: 'Redis'
    });

  } catch (error) {
    console.error('❌ 친구 추가 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 친구 관계 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const friendId = searchParams.get('friendId');

    if (!userId || !friendId) {
      return NextResponse.json(
        { error: '사용자 ID와 친구 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 사용자의 친구 목록 가져오기 (KV)
    const userFriends = await getFriendRelationships(userId);

    // 친구 제거
    const updatedFriends = userFriends.filter(friend => friend.friendId !== friendId);

    if (userFriends.length === updatedFriends.length) {
      return NextResponse.json(
        { error: '삭제할 친구를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 업데이트된 친구 목록 저장 (KV)
    await saveFriendRelationships(userId, updatedFriends);

    // 양방향 관계도 제거
    try {
      const deletedFriend = userFriends.find(friend => friend.friendId === friendId);
      if (deletedFriend) {
        const friendFriends = await getFriendRelationships(deletedFriend.friendAddress);
        const updatedFriendFriends = friendFriends.filter(friend => friend.friendId !== userId);

        if (friendFriends.length !== updatedFriendFriends.length) {
          await saveFriendRelationships(deletedFriend.friendAddress, updatedFriendFriends);
          console.log('🗑️ 양방향 친구 관계 삭제 완료');
        }
      }
    } catch (error) {
      console.error('양방향 친구 관계 삭제 실패:', error);
    }

    console.log('🗑️ 친구 삭제 완료:', friendId);

    return NextResponse.json({
      success: true,
      message: '친구가 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('❌ 친구 삭제 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 개발용: 모든 친구 관계 조회
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const debug = searchParams.get('debug');

    if (debug === 'list') {
      const allRelationships = await getAllFriendRelationships();
      const formattedRelationships = allRelationships.map(([userId, friends]) => ({
        userId,
        friends: friends.length,
        relationships: friends
      }));

      return NextResponse.json({
        success: true,
        totalUsers: allRelationships.length,
        relationships: formattedRelationships,
        storage: isKVAvailable() ? 'KV' : 'Memory'
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