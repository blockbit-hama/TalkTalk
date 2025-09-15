import { db } from '@/lib/database/inmemory-db';
import { 
  User, 
  Friend, 
  ChatRoom, 
  Message, 
  SendMessageRequest, 
  CreateRoomRequest, 
  AddFriendRequest 
} from '@/types/chat';

// User API
export const getUser = (id: string): User | undefined => {
  return db.getUser(id);
};

export const getAllUsers = (): User[] => {
  return db.getAllUsers();
};

export const createUser = (user: Omit<User, 'id'>): User => {
  return db.createUser(user);
};

export const updateUser = (id: string, updates: Partial<User>): User | undefined => {
  return db.updateUser(id, updates);
};

export const setUserOnline = (id: string, isOnline: boolean): void => {
  db.setUserOnline(id, isOnline);
};

export const searchUsers = (query: string): User[] => {
  return db.searchUsers(query);
};

// Friend API
export const getFriends = (userId: string): Friend[] => {
  return db.getFriends(userId);
};

export const addFriend = (userId: string, request: AddFriendRequest): Friend | undefined => {
  return db.addFriend(userId, request);
};

export const removeFriend = (userId: string, friendId: string): boolean => {
  return db.removeFriend(userId, friendId);
};

// Chat Room API
export const getChatRooms = (userId: string): ChatRoom[] => {
  return db.getChatRooms(userId);
};

export const getChatRoom = (id: string): ChatRoom | undefined => {
  return db.getChatRoom(id);
};

export const createChatRoom = (userId: string, request: CreateRoomRequest): ChatRoom | undefined => {
  return db.createChatRoom(userId, request);
};

export const createDirectChatRoom = (userId: string, friendId: string): ChatRoom | undefined => {
  const friend = db.getUser(friendId);
  if (!friend) return undefined;

  // Check if direct chat room already exists
  const existingRooms = db.getChatRooms(userId);
  const existingDirectRoom = existingRooms.find(room => 
    room.type === 'direct' && 
    room.participants.includes(friendId) &&
    room.participants.length === 2
  );

  if (existingDirectRoom) {
    return existingDirectRoom;
  }

  return db.createChatRoom(userId, {
    name: friend.name,
    type: 'direct',
    participants: [userId, friendId],
  });
};

// Message API
export const getMessages = (roomId: string): Message[] => {
  return db.getMessages(roomId);
};

export const sendMessage = (userId: string, request: SendMessageRequest): Message | undefined => {
  return db.sendMessage(userId, request);
};

export const sendTextMessage = (userId: string, roomId: string, content: string): Message | undefined => {
  return db.sendMessage(userId, {
    roomId,
    content,
    type: 'text',
  });
};

export const sendXRPTransferMessage = (
  userId: string, 
  roomId: string, 
  amount: string, 
  transactionHash: string
): Message | undefined => {
  return db.sendMessage(userId, {
    roomId,
    content: `${amount} XRP 전송`,
    type: 'xrp_transfer',
    metadata: {
      amount,
      currency: 'XRP',
      transactionHash,
    },
  });
};

export const sendTokenTransferMessage = (
  userId: string, 
  roomId: string, 
  tokenId: string, 
  amount: string, 
  transactionHash: string
): Message | undefined => {
  return db.sendMessage(userId, {
    roomId,
    content: `${amount} ${tokenId} 전송`,
    type: 'token_transfer',
    metadata: {
      tokenId,
      tokenAmount: amount,
      transactionHash,
    },
  });
};

export const markMessagesAsRead = (roomId: string, userId: string): void => {
  db.markMessagesAsRead(roomId, userId);
};

// Utility API
export const getOnlineUsers = (): string[] => {
  return db.getOnlineUsers();
};

export const getUnreadMessageCount = (userId: string): number => {
  const rooms = db.getChatRooms(userId);
  let unreadCount = 0;

  rooms.forEach(room => {
    const messages = db.getMessages(room.id);
    const unreadMessages = messages.filter(msg => 
      msg.senderId !== userId && !msg.isRead
    );
    unreadCount += unreadMessages.length;
  });

  return unreadCount;
};

export const getUnreadMessageCountForRoom = (roomId: string, userId: string): number => {
  const messages = db.getMessages(roomId);
  return messages.filter(msg => msg.senderId !== userId && !msg.isRead).length;
};