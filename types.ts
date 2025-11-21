
export enum UserStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  AWAY = 'AWAY',
}

export interface User {
  id: string;
  username: string;
  avatar: string;
  status: UserStatus;
  lastSeen?: Date;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: Date;
  type: 'text' | 'image' | 'system';
}

export interface Chat {
  id: string;
  type: 'dm' | 'group';
  name?: string; // Required for groups
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface SocketEvent {
  type: string;
  payload: any;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  chatId: string;
}
