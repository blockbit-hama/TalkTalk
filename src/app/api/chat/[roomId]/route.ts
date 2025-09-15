import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

// 로컬 개발용 메모리 저장소
const localChatRooms = new Map<string, any[]>();

// KV 연결 상태 확인
const isKVAvailable = () => {
  return process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;
};

// 메시지 조회 함수
async function getMessages(roomId: string): Promise<any[]> {
  try {
    if (isKVAvailable()) {
      const messages = await kv.get(`chat:${roomId}`);
      return messages || [];
    } else {
      return localChatRooms.get(roomId) || [];
    }
  } catch (error) {
    console.error('KV 조회 실패, 로컬 메모리 사용:', error);
    return localChatRooms.get(roomId) || [];
  }
}

// 메시지 저장 함수
async function saveMessages(roomId: string, messages: any[]): Promise<boolean> {
  try {
    if (isKVAvailable()) {
      await kv.set(`chat:${roomId}`, messages);
      console.log(`KV에 메시지 저장: ${roomId}, 개수: ${messages.length}`);
      return true;
    } else {
      localChatRooms.set(roomId, messages);
      console.log(`로컬 메모리에 메시지 저장: ${roomId}, 개수: ${messages.length}`);
      return true;
    }
  } catch (error) {
    console.error('KV 저장 실패, 로컬 메모리 사용:', error);
    localChatRooms.set(roomId, messages);
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;
    const messages = await getMessages(roomId);

    return NextResponse.json({
      success: true,
      messages,
      count: messages.length,
      storage: isKVAvailable() ? 'KV' : 'Memory'
    });
  } catch (error) {
    console.error('메시지 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: '메시지 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;
    const messageData = await request.json();

    // 새 메시지 객체 생성
    const newMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      roomId,
      senderId: messageData.senderId || 'anonymous',
      type: messageData.type || 'text',
      content: messageData.content,
      metadata: messageData.metadata || {},
      timestamp: new Date().toISOString(),
      isRead: false,
      sender: {
        id: messageData.senderId || 'anonymous',
        name: messageData.senderName || '익명',
        xrpAddress: messageData.senderXrpAddress,
        isOnline: true
      }
    };

    // 룸의 메시지 배열 가져오기
    const roomMessages = await getMessages(roomId);

    // 새 메시지 추가
    roomMessages.push(newMessage);

    // 메시지 수 제한 (최대 100개만 유지)
    if (roomMessages.length > 100) {
      roomMessages.splice(0, roomMessages.length - 100);
    }

    // KV 또는 로컬 메모리에 저장
    await saveMessages(roomId, roomMessages);

    console.log(`[채팅] 룸 ${roomId}에 새 메시지 추가:`, newMessage.content);

    return NextResponse.json({
      success: true,
      message: newMessage,
      totalMessages: roomMessages.length,
      storage: isKVAvailable() ? 'KV' : 'Memory'
    });
  } catch (error) {
    console.error('메시지 전송 실패:', error);
    return NextResponse.json(
      { success: false, error: '메시지 전송에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 채팅방 상태 조회 (디버깅용)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;
    const messages = await getMessages(roomId);

    return NextResponse.json({
      roomId,
      messageCount: messages.length,
      lastMessage: messages[messages.length - 1] || null,
      storage: isKVAvailable() ? 'KV' : 'Memory',
      kvAvailable: isKVAvailable()
    });
  } catch (error) {
    console.error('채팅방 상태 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: '채팅방 상태 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}