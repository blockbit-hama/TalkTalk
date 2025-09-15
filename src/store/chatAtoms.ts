import { atom } from 'jotai';
import { User, ChatRoom, Message, Friend } from '@/types/chat';

// Current user
export const currentUserAtom = atom<User | null>(null);

// Chat rooms
export const chatRoomsAtom = atom<ChatRoom[]>([]);

// Current chat room
export const currentChatRoomAtom = atom<ChatRoom | null>(null);

// Messages for current room
export const currentRoomMessagesAtom = atom<Message[]>([]);

// Friends list
export const friendsAtom = atom<Friend[]>([]);

// Online users
export const onlineUsersAtom = atom<string[]>([]);

// Unread message count
export const unreadMessageCountAtom = atom<number>(0);

// Chat UI state
export const isChatOpenAtom = atom<boolean>(false);
export const isFriendListOpenAtom = atom<boolean>(false);

// Message input state
export const messageInputAtom = atom<string>('');
export const isTypingAtom = atom<boolean>(false);

// Search state
export const searchQueryAtom = atom<string>('');
export const searchResultsAtom = atom<User[]>([]);

// Derived atoms
export const currentRoomUnreadCountAtom = atom((get) => {
  const currentRoom = get(currentChatRoomAtom);
  const currentUser = get(currentUserAtom);
  const messages = get(currentRoomMessagesAtom);
  
  if (!currentRoom || !currentUser) return 0;
  
  return messages.filter(msg => 
    msg.senderId !== currentUser.id && !msg.isRead
  ).length;
});

export const sortedChatRoomsAtom = atom((get) => {
  const rooms = get(chatRoomsAtom);
  return [...rooms].sort((a, b) => {
    const aTime = a.lastMessageAt?.getTime() || a.createdAt.getTime();
    const bTime = b.lastMessageAt?.getTime() || b.createdAt.getTime();
    return bTime - aTime;
  });
});

export const onlineFriendsAtom = atom((get) => {
  const friends = get(friendsAtom);
  const onlineUsers = get(onlineUsersAtom);
  
  return friends.filter(friend => 
    onlineUsers.includes(friend.friend.id)
  );
});

// Action atoms
export const sendMessageAtom = atom(
  null,
  async (get, set, { roomId, content, type, metadata }: {
    roomId: string;
    content: string;
    type: Message['type'];
    metadata?: Message['metadata'];
  }) => {
    const currentUser = get(currentUserAtom);
    if (!currentUser) return;

    // This would typically call the API
    // For now, we'll simulate it
    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      roomId,
      senderId: currentUser.id,
      type,
      content,
      metadata,
      timestamp: new Date(),
      isRead: false,
      sender: currentUser,
    };

    // Update messages
    const currentMessages = get(currentRoomMessagesAtom);
    if (roomId === get(currentChatRoomAtom)?.id) {
      set(currentRoomMessagesAtom, [...currentMessages, newMessage]);
    }

    // Update chat rooms
    const rooms = get(chatRoomsAtom);
    const updatedRooms = rooms.map(room => {
      if (room.id === roomId) {
        return {
          ...room,
          lastMessage: newMessage,
          lastMessageAt: newMessage.timestamp,
          updatedAt: new Date(),
        };
      }
      return room;
    });
    set(chatRoomsAtom, updatedRooms);
  }
);

export const createChatRoomAtom = atom(
  null,
  async (get, set, { name, type, participants }: {
    name: string;
    type: 'direct' | 'group';
    participants: string[];
  }) => {
    const currentUser = get(currentUserAtom);
    if (!currentUser) return;

    // This would typically call the API
    const newRoom: ChatRoom = {
      id: `room_${Date.now()}`,
      name,
      type,
      participants: [currentUser.id, ...participants],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set(chatRoomsAtom, [...get(chatRoomsAtom), newRoom]);
    return newRoom;
  }
);

export const addFriendAtom = atom(
  null,
  async (get, set, { friendId, nickname }: {
    friendId: string;
    nickname?: string;
  }) => {
    const currentUser = get(currentUserAtom);
    if (!currentUser) return;

    // This would typically call the API
    const newFriend: Friend = {
      id: `friend_${Date.now()}`,
      userId: currentUser.id,
      friendId,
      nickname,
      createdAt: new Date(),
      user: currentUser,
      friend: { id: friendId, name: nickname || 'Unknown', isOnline: false } as User,
    };

    set(friendsAtom, [...get(friendsAtom), newFriend]);
    return newFriend;
  }
);

export const markMessagesAsReadAtom = atom(
  null,
  (get, set, roomId: string) => {
    const currentUser = get(currentUserAtom);
    if (!currentUser) return;

    const messages = get(currentRoomMessagesAtom);
    const updatedMessages = messages.map(msg => {
      if (msg.senderId !== currentUser.id && !msg.isRead) {
        return { ...msg, isRead: true };
      }
      return msg;
    });

    set(currentRoomMessagesAtom, updatedMessages);
  }
);