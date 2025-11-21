
import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { Send, Paperclip, MoreVertical, Smile, Phone, Video, Info, Users } from 'lucide-react';
import { UserStatus } from '../types';

const ChatWindow: React.FC = () => {
  const { activeChatId, chats, messages, sendMessage, isLoadingMessages, onlineUsers } = useChat();
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChat = chats.find(c => c.id === activeChatId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;
    sendMessage(inputValue);
    setInputValue('');
  };

  if (!activeChat) {
    return (
      <div className="flex-1 bg-gray-950 flex flex-col items-center justify-center text-gray-500 space-y-6 p-8">
        <div className="relative">
            <div className="w-32 h-32 bg-gray-900 rounded-full flex items-center justify-center border-2 border-gray-800 z-10 relative">
                <Users className="w-12 h-12 text-gray-700" />
            </div>
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-blue-500/10 rounded-full blur-xl animate-pulse delay-700"></div>
        </div>
        
        <div className="text-center max-w-md">
            <h3 className="text-2xl font-bold text-gray-200 mb-2">Welcome to NestChat</h3>
            <p className="text-gray-400">
                Select a conversation from the sidebar or start a new one. 
                Experience real-time messaging powered by a simulated 
                <span className="text-indigo-400 font-mono mx-1">Nest.js</span> 
                backend with <span className="text-red-400 font-mono mx-1">Redis</span> caching.
            </p>
        </div>

        <div className="grid grid-cols-3 gap-4 text-xs text-gray-600 mt-8">
             <div className="flex flex-col items-center p-3 bg-gray-900 rounded-lg border border-gray-800">
                 <span className="font-bold text-gray-400 mb-1">WebSockets</span>
                 <span>Real-time events</span>
             </div>
             <div className="flex flex-col items-center p-3 bg-gray-900 rounded-lg border border-gray-800">
                 <span className="font-bold text-gray-400 mb-1">Redis</span>
                 <span>Presence Cache</span>
             </div>
             <div className="flex flex-col items-center p-3 bg-gray-900 rounded-lg border border-gray-800">
                 <span className="font-bold text-gray-400 mb-1">FCM</span>
                 <span>Push Notifications</span>
             </div>
        </div>
      </div>
    );
  }

  const isGroup = activeChat.type === 'group';
  const otherParticipant = !isGroup ? activeChat.participants.find(p => p.id !== user?.id) : null;
  const statusInfo = otherParticipant ? onlineUsers.get(otherParticipant.id) : null;
  
  const getStatusText = () => {
    if (isGroup) {
        const onlineCount = activeChat.participants.filter(p => {
            if (p.id === user?.id) return true;
            const status = onlineUsers.get(p.id)?.status;
            return status === UserStatus.ONLINE;
        }).length;
        return `${activeChat.participants.length} members, ${onlineCount} online`;
    }
    if (statusInfo?.status === UserStatus.ONLINE) return 'Online';
    if (statusInfo?.status === UserStatus.AWAY) return 'Away';
    if (statusInfo?.lastSeen) {
        return `Last seen ${new Date(statusInfo.lastSeen).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;
    }
    return 'Offline';
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-950 relative z-10">
      {/* Header */}
      <div className="h-20 border-b border-gray-800 bg-gray-900 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          {isGroup ? (
             <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-900/30">
                 <Users className="w-6 h-6" />
             </div>
          ) : (
            <div className="relative">
              <img src={otherParticipant?.avatar} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-gray-800" />
              {statusInfo?.status === UserStatus.ONLINE && (
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-gray-900"></div>
              )}
            </div>
          )}
          <div>
            <h2 className="font-bold text-white text-lg">
              {isGroup ? activeChat.name : otherParticipant?.username}
            </h2>
            <p className={`text-xs ${statusInfo?.status === UserStatus.ONLINE || isGroup ? 'text-indigo-300' : 'text-gray-500'} font-medium`}>
              {getStatusText()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-400">
          <button className="p-2 hover:bg-gray-800 rounded-full hover:text-white transition-colors"><Phone className="w-5 h-5" /></button>
          <button className="p-2 hover:bg-gray-800 rounded-full hover:text-white transition-colors"><Video className="w-5 h-5" /></button>
          <div className="w-px h-6 bg-gray-800 mx-2"></div>
          <button className="p-2 hover:bg-gray-800 rounded-full hover:text-white transition-colors"><Info className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-900/30">
        {isLoadingMessages ? (
            <div className="flex justify-center items-center h-full">
                <div className="flex flex-col items-center space-y-3">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-500 text-sm">Decrypting messages...</span>
                </div>
            </div>
        ) : (
            <>
                <div className="flex justify-center my-6">
                    <span className="bg-gray-800/50 border border-gray-800 text-gray-500 text-[10px] px-3 py-1 rounded-full uppercase tracking-widest">
                        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </span>
                </div>
                
                {messages.map((msg, idx) => {
                const isMe = msg.senderId === user?.id;
                const showAvatar = !isMe && (idx === 0 || messages[idx-1].senderId !== msg.senderId);
                const sender = activeChat.participants.find(p => p.id === msg.senderId);

                // Group sequential messages from same user
                const isSequence = idx > 0 && messages[idx-1].senderId === msg.senderId;

                return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group ${isSequence ? 'mt-1' : 'mt-4'}`}>
                    {!isMe && (
                        <div className="w-10 mr-3 flex flex-col justify-end flex-shrink-0">
                            {showAvatar ? (
                                <img src={sender?.avatar} className="w-10 h-10 rounded-full shadow-md" alt="" title={sender?.username} />
                            ) : <div className="w-10" />}
                        </div>
                    )}
                    
                    <div className={`max-w-[75%] break-words relative shadow-md transition-all ${
                        isMe 
                        ? 'bg-indigo-600 text-white rounded-2xl rounded-br-sm' 
                        : 'bg-gray-800 text-gray-100 rounded-2xl rounded-bl-sm'
                    } px-5 py-3`}>
                        {isGroup && !isMe && showAvatar && (
                            <p className="text-[11px] text-indigo-400 font-bold mb-1">{sender?.username}</p>
                        )}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <div className={`text-[10px] mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-500'} text-right opacity-70`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                        </div>
                    </div>
                    </div>
                );
                })}
                <div ref={messagesEndRef} />
            </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 bg-gray-900 border-t border-gray-800">
        <div className="flex items-end space-x-3 max-w-5xl mx-auto bg-gray-800 rounded-2xl p-2 shadow-xl border border-gray-700/50 transition-all focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/20">
          <button className="p-3 text-gray-400 hover:text-indigo-400 transition-colors hover:bg-gray-700 rounded-xl">
            <Paperclip className="w-5 h-5" />
          </button>
          
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                }
            }}
            placeholder={`Message ${isGroup ? activeChat.name : otherParticipant?.username || '...'}`}
            className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none py-3 max-h-32 resize-none custom-scrollbar"
            rows={1}
          />
          
          <button className="p-3 text-gray-400 hover:text-yellow-400 transition-colors hover:bg-gray-700 rounded-xl">
            <Smile className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => handleSend()}
            disabled={!inputValue.trim()}
            className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:hover:bg-indigo-600 shadow-lg shadow-indigo-600/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
