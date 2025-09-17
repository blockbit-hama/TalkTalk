import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

// 개발 환경에서는 메모리에 저장, 프로덕션에서는 Vercel KV 사용
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

// 메모리 저장소 (개발용)
const friendRelationships: Map<string, FriendRelationship[]> = new Map();

// KV 연결 상태 확인
const isKVAvailable = () => {
  return process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;
};

// 친구 관계 저장 함수
async function saveFriendRelationships(userId: string, relationships: FriendRelationship[]): Promise<void> {
  try {
    if (isKVAvailable()) {
      await kv.set(`friends:${userId}`, relationships);
      console.log(`✅ KV에 친구 관계 저장: ${userId} (${relationships.length}개)`);
    } else {
      friendRelationships.set(userId, relationships);
      console.log(`✅ 메모리에 친구 관계 저장: ${userId} (${relationships.length}개)`);
    }
  } catch (error) {
    console.error('KV 저장 실패, 메모리 사용:', error);
    friendRelationships.set(userId, relationships);
  }
}

// 친구 관계 조회 함수
async function getFriendRelationships(userId: string): Promise<FriendRelationship[]> {
  try {
    if (isKVAvailable()) {
      const relationships = await kv.get<FriendRelationship[]>(`friends:${userId}`);
      if (relationships) {
        console.log(`📞 KV에서 친구 관계 조회 성공: ${userId} (${relationships.length}개)`);
      }
      return relationships || [];
    } else {
      return friendRelationships.get(userId) || [];
    }
  } catch (error) {
    console.error('KV 조회 실패, 메모리 사용:', error);
    return friendRelationships.get(userId) || [];
  }
}

// 모든 친구 관계 조회 (디버그용)
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
      return relationships;
    } else {
      return Array.from(friendRelationships.entries());
    }
  } catch (error) {
    console.error('전체 조회 실패, 메모리 사용:', error);
    return Array.from(friendRelationships.entries());
  }
}

// 사용자의 친구 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 해당 사용자의 친구 목록 조회 (KV 또는 메모리)
    const userFriends = await getFriendRelationships(userId);

    console.log('📞 친구 목록 조회:', { userId, friendCount: userFriends.length });
    console.log('💾 저장소 타입:', isKVAvailable() ? 'Vercel KV' : 'Memory');

    return NextResponse.json({
      success: true,
      friends: userFriends,
      count: userFriends.length,
      storage: isKVAvailable() ? 'KV' : 'Memory'
    });

  } catch (error) {
    console.error('❌ 친구 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 친구 관계 추가
export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      friendId,
      friendName,
      friendPhone,
      friendAddress
    } = await request.json();

    console.log('👥 친구 관계 추가 요청:', {
      userId,
      friendId,
      friendName,
      friendPhone,
      friendAddress
    });

    // 입력 검증
    if (!userId || !friendId || !friendName || !friendPhone || !friendAddress) {
      return NextResponse.json(
        { error: '모든 필드가 필요합니다.' },
        { status: 400 }
      );
    }

    // 사용자의 기존 친구 목록 가져오기 (KV 또는 메모리)
    const userFriends = await getFriendRelationships(userId);

    // 이미 친구인지 확인
    const existingFriend = userFriends.find(friend =>
      friend.friendId === friendId || friend.friendPhone === friendPhone
    );

    if (existingFriend) {
      return NextResponse.json(
        { error: '이미 친구로 등록된 사용자입니다.' },
        { status: 409 }
      );
    }

    // 새 친구 관계 생성
    const newFriendship: FriendRelationship = {
      userId,
      friendId,
      friendName,
      friendPhone,
      friendAddress,
      isOnline: true, // 기본값
      lastSeen: new Date(),
      createdAt: new Date().toISOString()
    };

    // 1. 현재 사용자를 친구 목록에 추가
    userFriends.push(newFriendship);
    await saveFriendRelationships(userId, userFriends);

    // 2. 상대방에게도 나를 친구로 추가 (양방향 관계 생성)
    try {
      // 전화번호 매핑 API에서 현재 사용자의 전화번호와 이름 찾기
      const userPhoneResponse = await fetch(`http://localhost:9001/api/phone-mapping?walletAddress=${encodeURIComponent(userId)}`);
      let currentUserPhone = '알 수 없음';
      let currentUserName = '친구';

      if (userPhoneResponse.ok) {
        const phoneData = await userPhoneResponse.json();
        if (phoneData.success) {
          currentUserPhone = phoneData.phoneNumber;
          currentUserName = phoneData.userName || '친구'; // 서버에서 받은 실제 이름 사용
        }
      }

      // 상대방의 친구 목록에 현재 사용자를 추가
      const friendFriends = await getFriendRelationships(friendAddress);

      // 상대방 친구 목록에서 나를 이미 친구로 가지고 있는지 확인
      const existingReverseFriend = friendFriends.find(friend =>
        friend.friendId === userId || friend.friendPhone === currentUserPhone
      );

      if (!existingReverseFriend) {
        const reverseFriendship: FriendRelationship = {
          userId: friendAddress, // 상대방이 주인
          friendId: userId, // 나를 친구로
          friendName: currentUserName, // 상대방이 나를 부를 이름 (기본값)
          friendPhone: currentUserPhone,
          friendAddress: userId,
          isOnline: true,
          lastSeen: new Date(),
          createdAt: new Date().toISOString()
        };

        friendFriends.push(reverseFriendship);
        await saveFriendRelationships(friendAddress, friendFriends);

        console.log('🔄 양방향 친구 관계 생성:', reverseFriendship);
      }
    } catch (error) {
      console.error('양방향 친구 관계 생성 실패 (단방향으로 진행):', error);
    }

    console.log('✅ 친구 관계 추가 완료:', newFriendship);
    console.log('💾 저장소 타입:', isKVAvailable() ? 'Vercel KV' : 'Memory');

    return NextResponse.json({
      success: true,
      message: '친구가 성공적으로 추가되었습니다.',
      friend: newFriendship,
      storage: isKVAvailable() ? 'KV' : 'Memory'
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

    // 사용자의 친구 목록 가져오기 (KV 또는 메모리)
    const userFriends = await getFriendRelationships(userId);

    // 친구 제거
    const updatedFriends = userFriends.filter(friend => friend.friendId !== friendId);

    if (userFriends.length === updatedFriends.length) {
      return NextResponse.json(
        { error: '삭제할 친구를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 업데이트된 친구 목록 저장 (KV 또는 메모리)
    await saveFriendRelationships(userId, updatedFriends);

    console.log('🗑️ 친구 관계 삭제 완료:', { userId, friendId });
    console.log('💾 저장소 타입:', isKVAvailable() ? 'Vercel KV' : 'Memory');

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