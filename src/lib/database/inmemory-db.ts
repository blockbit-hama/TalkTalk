import { User, Friend, ChatRoom, Message, SendMessageRequest, CreateRoomRequest, AddFriendRequest } from '@/types/chat';

class InMemoryDatabase {
  private users: Map<string, User> = new Map();
  private friends: Map<string, Friend[]> = new Map(); // userId -> friends
  private chatRooms: Map<string, ChatRoom> = new Map();
  private messages: Map<string, Message[]> = new Map(); // roomId -> messages
  private onlineUsers: Set<string> = new Set();

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default users
    const defaultUsers: User[] = [
      {
        id: 'user1',
        name: 'Alice',
        avatar: '/avatars/alice.jpg',
        xrplAddress: 'rAlice123456789012345678901234567890123456',
        isOnline: true,
        lastSeen: new Date(),
      },
      {
        id: 'user2',
        name: 'Bob',
        avatar: '/avatars/bob.jpg',
        xrplAddress: 'rBob123456789012345678901234567890123456',
        isOnline: true,
        lastSeen: new Date(),
      },
      {
        id: 'user3',
        name: 'Charlie',
        avatar: '/avatars/charlie.jpg',
        xrplAddress: 'rCharlie123456789012345678901234567890123',
        isOnline: false,
        lastSeen: new Date(Date.now() - 3600000), // 1 hour ago
      },
    ];

    defaultUsers.forEach(user => {
      this.users.set(user.id, user);
      if (user.isOnline) {
        this.onlineUsers.add(user.id);
      }
    });

    // Create default friends
    const defaultFriends: Friend[] = [
      {
        id: 'friend1',
        userId: 'user1',
        friendId: 'user2',
        nickname: 'Bob',
        createdAt: new Date(),
        user: defaultUsers[0],
        friend: defaultUsers[1],
      },
      {
        id: 'friend2',
        userId: 'user2',
        friendId: 'user1',
        nickname: 'Alice',
        createdAt: new Date(),
        user: defaultUsers[1],
        friend: defaultUsers[0],
      },
    ];

    defaultFriends.forEach(friend => {
      const userFriends = this.friends.get(friend.userId) || [];
      userFriends.push(friend);
      this.friends.set(friend.userId, userFriends);
    });

    // Create default chat room
    const defaultRoom: ChatRoom = {
      id: 'room1',
      name: 'Alice & Bob',
      type: 'direct',
      participants: ['user1', 'user2'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.chatRooms.set(defaultRoom.id, defaultRoom);

    // Create default messages
    const defaultMessages: Message[] = [
      {
        id: 'msg1',
        roomId: 'room1',
        senderId: 'user1',
        type: 'text',
        content: '안녕하세요! XRP를 보내드릴게요.',
        timestamp: new Date(Date.now() - 300000), // 5 minutes ago
        isRead: true,
        sender: defaultUsers[0],
      },
      {
        id: 'msg2',
        roomId: 'room1',
        senderId: 'user2',
        type: 'text',
        content: '감사합니다! 받았어요.',
        timestamp: new Date(Date.now() - 180000), // 3 minutes ago
        isRead: true,
        sender: defaultUsers[1],
      },
      {
        id: 'msg3',
        roomId: 'room1',
        senderId: 'user1',
        type: 'xrp_transfer',
        content: 'XRP 전송',
        metadata: {
          amount: '10',
          currency: 'XRP',
          transactionHash: 'tx1234567890abcdef',
        },
        timestamp: new Date(Date.now() - 120000), // 2 minutes ago
        isRead: false,
        sender: defaultUsers[0],
      },
    ];

    this.messages.set(defaultRoom.id, defaultMessages);

    // Update room's last message
    defaultRoom.lastMessage = defaultMessages[defaultMessages.length - 1];
    defaultRoom.lastMessageAt = defaultRoom.lastMessage.timestamp;
  }

  // User methods
  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  createUser(user: Omit<User, 'id'>): User {
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  setUserOnline(id: string, isOnline: boolean): void {
    const user = this.users.get(id);
    if (user) {
      user.isOnline = isOnline;
      user.lastSeen = new Date();
      
      if (isOnline) {
        this.onlineUsers.add(id);
      } else {
        this.onlineUsers.delete(id);
      }
    }
  }

  // Friend methods
  getFriends(userId: string): Friend[] {
    return this.friends.get(userId) || [];
  }

  addFriend(userId: string, request: AddFriendRequest): Friend | undefined {
    const friend = this.users.get(request.friendId);
    const user = this.users.get(userId);
    
    if (!friend || !user) return undefined;

    const newFriend: Friend = {
      id: `friend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      friendId: request.friendId,
      nickname: request.nickname,
      createdAt: new Date(),
      user,
      friend,
    };

    const userFriends = this.friends.get(userId) || [];
    userFriends.push(newFriend);
    this.friends.set(userId, userFriends);

    return newFriend;
  }

  removeFriend(userId: string, friendId: string): boolean {
    const userFriends = this.friends.get(userId);
    if (!userFriends) return false;

    const filteredFriends = userFriends.filter(f => f.friendId !== friendId);
    this.friends.set(userId, filteredFriends);
    return true;
  }

  // Chat room methods
  getChatRooms(userId: string): ChatRoom[] {
    return Array.from(this.chatRooms.values())
      .filter(room => room.participants.includes(userId))
      .sort((a, b) => (b.lastMessageAt?.getTime() || 0) - (a.lastMessageAt?.getTime() || 0));
  }

  getChatRoom(id: string): ChatRoom | undefined {
    return this.chatRooms.get(id);
  }

  createChatRoom(userId: string, request: CreateRoomRequest): ChatRoom | undefined {
    const id = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Ensure the creator is in participants
    const participants = request.participants.includes(userId) 
      ? request.participants 
      : [userId, ...request.participants];

    const newRoom: ChatRoom = {
      id,
      name: request.name,
      type: request.type,
      participants,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.chatRooms.set(id, newRoom);
    this.messages.set(id, []);
    
    return newRoom;
  }

  // Message methods
  getMessages(roomId: string): Message[] {
    return this.messages.get(roomId) || [];
  }

  sendMessage(userId: string, request: SendMessageRequest): Message | undefined {
    const room = this.chatRooms.get(request.roomId);
    const sender = this.users.get(userId);
    
    if (!room || !sender || !room.participants.includes(userId)) {
      return undefined;
    }

    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      roomId: request.roomId,
      senderId: userId,
      type: request.type,
      content: request.content,
      metadata: request.metadata,
      timestamp: new Date(),
      isRead: false,
      sender,
    };

    const roomMessages = this.messages.get(request.roomId) || [];
    roomMessages.push(message);
    this.messages.set(request.roomId, roomMessages);

    // Update room's last message
    room.lastMessage = message;
    room.lastMessageAt = message.timestamp;
    room.updatedAt = new Date();

    return message;
  }

  markMessagesAsRead(roomId: string, userId: string): void {
    const messages = this.messages.get(roomId);
    if (!messages) return;

    messages.forEach(message => {
      if (message.senderId !== userId && !message.isRead) {
        message.isRead = true;
      }
    });
  }

  // Utility methods
  getOnlineUsers(): string[] {
    return Array.from(this.onlineUsers);
  }

  searchUsers(query: string): User[] {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.users.values())
      .filter(user => 
        user.name.toLowerCase().includes(lowercaseQuery) ||
        user.xrplAddress?.toLowerCase().includes(lowercaseQuery)
      );
  }

  // Clear all data (for testing)
  clear(): void {
    this.users.clear();
    this.friends.clear();
    this.chatRooms.clear();
    this.messages.clear();
    this.onlineUsers.clear();
  }
}

// Singleton instance
export const db = new InMemoryDatabase();