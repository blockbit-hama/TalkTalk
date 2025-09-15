export interface User {
  id: string;
  name: string;
  avatar?: string;
  xrplAddress?: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  nickname?: string;
  createdAt: Date;
  user: User;
  friend: User;
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'direct' | 'group';
  participants: string[]; // User IDs
  lastMessage?: Message;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
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
  };
  timestamp: Date;
  isRead: boolean;
  sender: User;
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