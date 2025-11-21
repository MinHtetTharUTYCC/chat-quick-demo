
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Chat, Message, User, UserStatus } from '../types';
import { mockSocket, api } from '../services/mockBackend';
import { useAuth } from './AuthContext';

interface ChatContextType {
  chats: Chat[];
  activeChatId: string | null;
  messages: Message[];
  isLoadingMessages: boolean;
  onlineUsers: Map<string, { status: UserStatus; lastSeen?: Date }>;
  allUsers: User[];
  selectChat: (chatId: string) => void;
  sendMessage: (content: string, type?: 'text' | 'image') => void;
  createChat: (participantIds: string[], type: 'dm' | 'group', name?: string) => void;
  isConnected: boolean;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Map<string, { status: UserStatus; lastSeen?: Date }>>(new Map());
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Initialize Socket and Load Data
  useEffect(() => {
    if (!token || !user) return;

    const init = async () => {
      await mockSocket.connect(token);
      setIsConnected(true);
      
      const [loadedChats, loadedUsers] = await Promise.all([
          api.getChats(user.id),
          api.getAllUsers()
      ]);
      
      setChats(loadedChats);
      setAllUsers(loadedUsers);
      
      // Initialize user statuses map from initial data
      const initialMap = new Map();
      loadedUsers.forEach(u => {
         if (u.id !== user.id) {
             initialMap.set(u.id, { status: u.status, lastSeen: u.lastSeen });
         }
      });
      setOnlineUsers(initialMap);
    };

    init();

    mockSocket.on('message.new', (payload: { chatId: string; message: Message }) => {
      // Play sound or show notification if background
      if (activeChatId === payload.chatId) {
        setMessages(prev => [...prev, payload.message]);
      } 
      
      // Update chat list preview
      setChats(prev => {
          const chatExists = prev.find(c => c.id === payload.chatId);
          // If chat exists, update it. If it's a new incoming chat (handled by chat.created usually), it might not be here yet unless we refetch.
          // For simplicity, we update if exists.
          if (chatExists) {
              return prev.map(c => {
                if (c.id === payload.chatId) {
                  const isUnread = activeChatId !== payload.chatId;
                  return { 
                      ...c, 
                      unreadCount: isUnread ? c.unreadCount + 1 : 0, 
                      lastMessage: payload.message 
                  };
                }
                return c;
              }).sort((a, b) => new Date(b.lastMessage?.createdAt || 0).getTime() - new Date(a.lastMessage?.createdAt || 0).getTime());
          }
          return prev;
      });
    });

    mockSocket.on('chat.created', (newChat: Chat) => {
        setChats(prev => [newChat, ...prev]);
    });

    mockSocket.on('user.status_change', (payload: { userId: string; status: UserStatus; lastSeen: Date }) => {
      setOnlineUsers(prev => {
        const newMap = new Map(prev);
        newMap.set(payload.userId, { status: payload.status, lastSeen: payload.lastSeen });
        return newMap;
      });
      // Also update the allUsers list status visually if needed, though mostly we use the Map
      setAllUsers(prev => prev.map(u => u.id === payload.userId ? { ...u, status: payload.status, lastSeen: payload.lastSeen } : u));
    });

    return () => {
      mockSocket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  // Load Messages when Active Chat Changes
  useEffect(() => {
    if (!activeChatId) return;

    const loadMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const history = await api.getMessages(activeChatId);
        setMessages(history);
        
        // Reset unread count
        setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, unreadCount: 0 } : c));
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [activeChatId]);

  const sendMessage = useCallback((content: string, type: 'text' | 'image' = 'text') => {
    if (!activeChatId || !user) return;

    // Optimistic update
    const tempId = 'temp-' + Date.now();
    const newMessage: Message = {
      id: tempId,
      senderId: user.id,
      content,
      createdAt: new Date(),
      type
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Update last message in chat list immediately
    setChats(prev => prev.map(c => 
      c.id === activeChatId ? { ...c, lastMessage: newMessage } : c
    ).sort((a, b) => new Date(b.lastMessage?.createdAt || 0).getTime() - new Date(a.lastMessage?.createdAt || 0).getTime()));
    
    // Emit to backend
    mockSocket.emitServer('sendMessage', { chatId: activeChatId, content, type });

  }, [activeChatId, user]);

  const createChat = useCallback((participantIds: string[], type: 'dm' | 'group', name?: string) => {
    // Emit intention to create chat to NestJS backend via WebSocket or API
    // Here we use the mocked API which simulates the backend call
    mockSocket.emitServer('createChat', { participants: participantIds, type, name });
  }, []);

  return (
    <ChatContext.Provider value={{
      chats,
      activeChatId,
      messages,
      isLoadingMessages,
      onlineUsers,
      allUsers,
      selectChat: setActiveChatId,
      sendMessage,
      createChat,
      isConnected
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
};
