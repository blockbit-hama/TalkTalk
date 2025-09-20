export interface User {
  id: string;                    // 사용자 ID (전화번호)
  name: string;                  // 사용자 이름
  avatar?: string;               // 프로필 이미지
  xrplAddress?: string;         // XRPL 지갑 주소
  phoneNumber?: string;          // 전화번호 (기존 호환성)
  assets?: UserAssets;          // 사용자 자산 정보
  isOnline: boolean;            // 온라인 상태
  lastSeen?: Date;              // 마지막 접속 시간
  createdAt?: Date;             // 계정 생성 시간
  updatedAt?: Date;             // 마지막 업데이트 시간
}

// 사용자 자산 정보
export interface UserAssets {
  xrp: {
    balance: string;             // XRP 잔액
    address: string;             // XRPL 주소
  };
  tokens: TokenBalance[];        // 토큰 잔액 목록
}

// 토큰 잔액 정보
export interface TokenBalance {
  currency: string;              // 토큰 코드
  issuer: string;                // 발행자 주소
  balance: string;               // 잔액
  trustline?: boolean;           // 트러스트라인 설정 여부
}

export interface Friend {
  id: string;
  userId: string;                // 사용자 ID (전화번호)
  friendId: string;              // 친구 ID (전화번호)
  nickname?: string;             // 친구 별명
  createdAt: Date;               // 친구 추가 시간
  user: User;                    // 사용자 정보
  friend: User;                  // 친구 정보
  // 전화번호 기반 친구 정보 (기존 호환성)
  friendPhone?: string;          // 친구 전화번호
  friendName?: string;           // 친구 이름
  friendAddress?: string;        // 친구 지갑 주소
  isOnline?: boolean;            // 친구 온라인 상태
  lastSeen?: Date;               // 친구 마지막 접속 시간
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'direct' | 'group';
  participants: string[];         // User IDs (전화번호)
  lastMessage?: Message;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // 전화번호 기반 채팅방 정보
  participantPhones?: string[];   // 참여자 전화번호 목록
  roomName?: string;              // 채팅방 이름 (그룹채팅용)
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;              // 발신자 ID (전화번호)
  type: 'text' | 'xrp_transfer' | 'token_transfer' | 'image' | 'system';
  content: string;
  metadata?: {
    // For XRP transfers
    amount?: string;
    currency?: string;
    transactionHash?: string;
    // For images
    imageUrl?: string;
    // For tokens
    tokenId?: string;
    tokenAmount?: string;
    tokenIssuer?: string;         // 토큰 발행자
  };
  timestamp: Date;
  isRead: boolean;
  sender: User;
  // 전화번호 기반 메시지 정보
  senderPhone?: string;          // 발신자 전화번호
}

export interface ChatState {
  currentRoomId?: string;
  rooms: ChatRoom[];
  messages: Record<string, Message[]>; // roomId -> messages
  friends: Friend[];
  onlineUsers: Set<string>;
}

export interface SendMessageRequest {
  roomId: string;
  content: string;
  type: Message['type'];
  metadata?: Message['metadata'];
}

export interface CreateRoomRequest {
  name: string;
  type: 'direct' | 'group';
  participants: string[];
}

export interface AddFriendRequest {
  friendId: string;
  nickname?: string;
}