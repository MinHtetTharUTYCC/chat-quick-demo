
import { User, UserStatus, Chat, Message } from '../types';

/**
 * MOCK BACKEND SERVICE
 * 
 * Simulates a Nest.js Microservices Architecture:
 * 1. RedisService: Key-value store for User Presence (ONLINE/OFFLINE).
 * 2. NotificationService: Simulates Firebase Cloud Messaging (FCM) for offline push notifications.
 * 3. ChatGateway: WebSocket Gateway.
 * 4. ChatService: Business logic for creating chats and storing messages.
 */

const MOCK_DELAY = 300;

// --- MOCK DATABASE (Postgres Simulation) ---
const DB_USERS: User[] = [
  { id: 'u1', username: 'John Doe', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', status: UserStatus.OFFLINE },
  { id: 'u2', username: 'Alice Smith', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', status: UserStatus.OFFLINE, lastSeen: new Date(Date.now() - 1000 * 60 * 5) },
  { id: 'u3', username: 'Bob Johnson', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', status: UserStatus.OFFLINE, lastSeen: new Date(Date.now() - 1000 * 60 * 30) },
  { id: 'u4', username: 'Sarah Wilson', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', status: UserStatus.OFFLINE },
  { id: 'u5', username: 'Mike Chen', avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', status: UserStatus.OFFLINE },
];

let DB_CHATS: Chat[] = [
  {
    id: 'c1',
    type: 'dm',
    participants: [DB_USERS[0], DB_USERS[1]],
    unreadCount: 2,
    lastMessage: { id: 'm1', senderId: 'u2', content: 'Hey, are you available?', createdAt: new Date(Date.now() - 1000 * 60 * 60), type: 'text' }
  },
  {
    id: 'c2',
    type: 'group',
    name: 'NestJS Developers',
    participants: [DB_USERS[0], DB_USERS[2], DB_USERS[3]],
    unreadCount: 0,
    lastMessage: { id: 'm2', senderId: 'u3', content: 'Did you check the PR?', createdAt: new Date(Date.now() - 1000 * 60 * 10), type: 'text' }
  }
];

const DB_MESSAGES: Record<string, Message[]> = {
  'c1': [
    { id: 'm0', senderId: 'u1', content: 'Hi Alice!', createdAt: new Date(Date.now() - 1000 * 60 * 120), type: 'text' },
    { id: 'm1', senderId: 'u2', content: 'Hey, are you available?', createdAt: new Date(Date.now() - 1000 * 60 * 60), type: 'text' },
  ],
  'c2': [
    { id: 'm2', senderId: 'u3', content: 'Did you check the PR?', createdAt: new Date(Date.now() - 1000 * 60 * 10), type: 'text' }
  ]
};

// --- REDIS SERVICE SIMULATION ---
// Used for caching presence and session data
const REDIS_STORE = new Map<string, string>();

const MockRedisService = {
  setUserOnline: (userId: string, socketId: string) => {
    REDIS_STORE.set(`user:online:${userId}`, socketId);
    // Update DB for persistence as well (simulated sync)
    const u = DB_USERS.find(u => u.id === userId);
    if (u) u.status = UserStatus.ONLINE;
  },
  setUserOffline: (userId: string) => {
    REDIS_STORE.delete(`user:online:${userId}`);
    const u = DB_USERS.find(u => u.id === userId);
    if (u) {
      u.status = UserStatus.OFFLINE;
      u.lastSeen = new Date();
    }
  },
  isUserOnline: (userId: string) => {
    return REDIS_STORE.has(`user:online:${userId}`);
  }
};

// --- NOTIFICATION SERVICE SIMULATION ---
const MockNotificationService = {
  sendPushNotification: (toUserId: string, title: string, body: string) => {
    console.log(`%c[FCM PUSH] To ${toUserId}: ${title} - ${body}`, 'color: #ec4899; font-weight: bold;');
    // In a real app, this would call Firebase Admin SDK
  }
};

// --- WEBSOCKET GATEWAY SIMULATION ---
class MockSocket {
  private handlers: Map<string, Function[]> = new Map();
  public connected = false;
  private userId: string | null = null;
  private socketId: string | null = null;

  connect(token: string) {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.connected = true;
        this.userId = token.split(':')[0];
        this.socketId = 'sock_' + Math.random().toString(36).substr(2, 9);
        
        // Redis: Cache user session
        MockRedisService.setUserOnline(this.userId!, this.socketId);
        
        this.emit('connect', {});
        resolve();
        
        // Broadcast presence to others
        this.broadcastPresence(UserStatus.ONLINE);
        
        // Start receiving mock updates from others
        this.startSimulationLoop();
      }, MOCK_DELAY);
    });
  }

  disconnect() {
    if (this.userId) {
      MockRedisService.setUserOffline(this.userId);
      this.broadcastPresence(UserStatus.OFFLINE);
    }
    this.connected = false;
    this.emit('disconnect', {});
  }

  on(event: string, callback: Function) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)?.push(callback);
  }

  // Client -> Server
  emitServer(event: string, payload: any) {
    setTimeout(() => {
      this.handleServerEvent(event, payload);
    }, MOCK_DELAY / 2);
  }

  // Server -> Client
  private emit(event: string, payload: any) {
    const callbacks = this.handlers.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(payload));
    }
  }

  private broadcastPresence(status: UserStatus) {
    // In real life, this goes via Redis Pub/Sub to other gateway instances
    // Here we just simulate receiving it back for demo purposes (user sees themselves online)
    // and we rely on the simulation loop to update other users
  }

  private handleServerEvent(event: string, payload: any) {
    switch (event) {
      case 'sendMessage':
        this.handleSendMessage(payload);
        break;
      case 'createChat':
        this.handleCreateChat(payload);
        break;
    }
  }

  private handleSendMessage(payload: { chatId: string; content: string; type: string }) {
    const { chatId, content, type } = payload;
    const chat = DB_CHATS.find(c => c.id === chatId);
    if (!chat) return;

    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: this.userId!,
      content,
      createdAt: new Date(),
      type: (type as 'text' | 'image' | 'system') || 'text'
    };

    // Save to DB
    if (!DB_MESSAGES[chatId]) DB_MESSAGES[chatId] = [];
    DB_MESSAGES[chatId].push(newMessage);
    chat.lastMessage = newMessage;

    // Distribute to participants
    chat.participants.forEach(p => {
      if (p.id === this.userId) {
        // Ack to sender
        this.emit('message.new', { chatId, message: newMessage });
      } else {
        // Check Redis for presence
        const isOnline = MockRedisService.isUserOnline(p.id);
        
        if (isOnline) {
          // Simulate real-time socket delivery to other user
          // In this mock, we can't actually push to another browser instance easily without BroadcastChannel,
          // but we assume the current client handles its own state. 
          // For demo: We won't see the message appear in 'other' windows, but logic is here.
        } else {
          // User is offline -> Send Push Notification
          MockNotificationService.sendPushNotification(
            p.id, 
            chat.type === 'group' ? `New message in ${chat.name}` : `New message from ${this.userId}`, 
            content
          );
        }
      }
    });
  }

  private handleCreateChat(payload: { participants: string[]; type: 'dm' | 'group'; name?: string }) {
    const { participants, type, name } = payload;
    
    // Resolve participant objects
    const participantUsers = DB_USERS.filter(u => participants.includes(u.id) || u.id === this.userId);
    
    const newChat: Chat = {
      id: 'c_' + Date.now(),
      type,
      name: name || (type === 'dm' ? '' : 'New Group'),
      participants: participantUsers,
      unreadCount: 0
    };

    DB_CHATS.unshift(newChat);
    this.emit('chat.created', newChat);
  }

  private startSimulationLoop() {
    // Simulate incoming events from Redis Pub/Sub (other users coming online/offline)
    setInterval(() => {
      if (!this.connected) return;
      
      const randomUser = DB_USERS.find(u => u.id !== this.userId);
      if (!randomUser) return;

      // 30% chance to flip status
      if (Math.random() > 0.7) {
        const isNowOnline = Math.random() > 0.5;
        const newStatus = isNowOnline ? UserStatus.ONLINE : UserStatus.OFFLINE;
        
        if (isNowOnline) MockRedisService.setUserOnline(randomUser.id, 'mock_sock');
        else MockRedisService.setUserOffline(randomUser.id);

        this.emit('user.status_change', { 
            userId: randomUser.id, 
            status: newStatus, 
            lastSeen: new Date() 
        });
      }
    }, 5000);
    
    // Simulate incoming message from a random chat (Notification test)
    setInterval(() => {
        if(!this.connected) return;
        if (Math.random() > 0.9) { // Occasional message
            const myChats = DB_CHATS.filter(c => c.participants.some(p => p.id === this.userId));
            if (myChats.length === 0) return;
            const randomChat = myChats[Math.floor(Math.random() * myChats.length)];
            const sender = randomChat.participants.find(p => p.id !== this.userId);
            
            if(sender) {
                const incomingMsg: Message = {
                    id: 'inc_' + Date.now(),
                    senderId: sender.id,
                    content: "Simulated message from Redis Pub/Sub stream...",
                    createdAt: new Date(),
                    type: 'text'
                };
                
                if (!DB_MESSAGES[randomChat.id]) DB_MESSAGES[randomChat.id] = [];
                DB_MESSAGES[randomChat.id].push(incomingMsg);
                randomChat.lastMessage = incomingMsg;
                randomChat.unreadCount++;

                this.emit('message.new', { chatId: randomChat.id, message: incomingMsg });
            }
        }
    }, 15000);
  }
}

export const mockSocket = new MockSocket();

export const api = {
  login: async (username: string) => {
    await new Promise(r => setTimeout(r, 500));
    let user = DB_USERS.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (!user) {
      // Register new user
      user = {
        id: 'u' + Math.random().toString().substr(2, 5),
        username,
        avatar: `https://ui-avatars.com/api/?name=${username}&background=random`,
        status: UserStatus.ONLINE
      };
      DB_USERS.push(user);
    }
    
    return {
      user,
      token: `${user.id}:mock-jwt-token`
    };
  },
  
  getChats: async (userId: string) => {
    await new Promise(r => setTimeout(r, 300));
    // Filter chats where user is participant
    return DB_CHATS.filter(c => c.participants.some(p => p.id === userId));
  },

  getMessages: async (chatId: string) => {
    await new Promise(r => setTimeout(r, 200));
    return DB_MESSAGES[chatId] || [];
  },

  getAllUsers: async () => {
      await new Promise(r => setTimeout(r, 300));
      return DB_USERS;
  },

  createChat: async (participants: string[], type: 'dm' | 'group', name?: string) => {
      // This is now handled via Socket for real-time, but we keep API for fallback
      mockSocket.emitServer('createChat', { participants, type, name });
  }
};
