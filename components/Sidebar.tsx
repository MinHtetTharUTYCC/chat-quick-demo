
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { UserStatus } from '../types';
import { LogOut, Search, Plus, Users, Circle } from 'lucide-react';
import CreateChatModal from './CreateChatModal';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { chats, selectChat, activeChatId, onlineUsers } = useChat();
  const [filter, setFilter] = useState<'all' | 'dm' | 'group'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchChatTerm, setSearchChatTerm] = useState('');

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ONLINE: return 'bg-green-500';
      case UserStatus.AWAY: return 'bg-yellow-500';
      case UserStatus.OFFLINE: return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getChatName = (chat: any) => {
    if (chat.type === 'group') return chat.name;
    // For DM, find the other participant
    const other = chat.participants.find((p: any) => p.id !== user?.id);
    return other?.username || 'Unknown User';
  };

  const getChatStatus = (chat: any) => {
    if (chat.type === 'group') return null;
    const other = chat.participants.find((p: any) => p.id !== user?.id);
    if (!other) return null;
    // Check real-time status map
    const statusInfo = onlineUsers.get(other.id);
    return statusInfo?.status || other.status;
  };

  const filteredChats = chats
    .filter(c => filter === 'all' || c.type === filter)
    .filter(c => getChatName(c).toLowerCase().includes(searchChatTerm.toLowerCase()));

  return (
    <>
      <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col h-full relative z-0">
        {/* User Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img src={user?.avatar} alt="Me" className="w-10 h-10 rounded-full border-2 border-gray-700" />
              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-gray-900"></div>
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">{user?.username}</h3>
              <p className="text-[10px] text-green-400 flex items-center uppercase tracking-wider font-bold">
                <Circle className="w-1.5 h-1.5 mr-1 fill-current" />
                Online
              </p>
            </div>
          </div>
          <button onClick={logout} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter */}
        <div className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search chats..."
              value={searchChatTerm}
              onChange={(e) => setSearchChatTerm(e.target.value)}
              className="w-full bg-gray-800 text-sm text-white pl-10 pr-4 py-2.5 rounded-lg focus:ring-2 focus:ring-indigo-900 focus:border-indigo-500 outline-none placeholder-gray-500 transition-all border border-gray-700"
            />
          </div>
          
          <div className="flex bg-gray-800 p-1 rounded-lg">
            <button 
              onClick={() => setFilter('all')}
              className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${filter === 'all' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-300'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('dm')}
              className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${filter === 'dm' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-300'}`}
            >
              Direct
            </button>
            <button 
              onClick={() => setFilter('group')}
              className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${filter === 'group' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-300'}`}
            >
              Groups
            </button>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-2">
          {filteredChats.length === 0 ? (
            <div className="text-center text-gray-600 mt-10 text-sm flex flex-col items-center">
                <Search className="w-8 h-8 mb-2 opacity-20" />
                <p>No conversations found</p>
            </div>
          ) : (
            filteredChats.map(chat => {
              const status = getChatStatus(chat);
              const isGroup = chat.type === 'group';
              
              return (
                <div 
                  key={chat.id}
                  onClick={() => selectChat(chat.id)}
                  className={`p-3 rounded-xl cursor-pointer mb-1 transition-all flex items-center space-x-3 group relative overflow-hidden ${activeChatId === chat.id ? 'bg-indigo-600/10 border border-indigo-500/30' : 'hover:bg-gray-800 border border-transparent'}`}
                >
                  {activeChatId === chat.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>}
                  
                  <div className="relative flex-shrink-0">
                    {isGroup ? (
                       <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 ring-2 ring-gray-800">
                          <Users className="w-6 h-6" />
                       </div>
                    ) : (
                      <>
                        <img 
                          src={chat.participants.find((p: any) => p.id !== user?.id)?.avatar} 
                          alt="User" 
                          className="w-12 h-12 rounded-full bg-gray-700 object-cover ring-2 ring-gray-800" 
                        />
                        {status && (
                          <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-gray-900 ${getStatusColor(status)}`}></div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className={`text-sm font-semibold truncate ${activeChatId === chat.id ? 'text-indigo-200' : 'text-gray-200'}`}>
                        {getChatName(chat)}
                      </h4>
                      {chat.lastMessage && (
                          <span className="text-[10px] text-gray-500 ml-2 flex-shrink-0">
                              {new Date(chat.lastMessage.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={`text-xs truncate pr-2 ${chat.unreadCount > 0 ? 'text-gray-300 font-medium' : 'text-gray-500'}`}>
                        {chat.lastMessage?.senderId === user?.id && <span className="text-indigo-400">You: </span>}
                        {chat.lastMessage?.content || <span className="italic text-gray-600">No messages yet</span>}
                      </p>
                      {chat.unreadCount > 0 && (
                        <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg shadow-indigo-500/30">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Action */}
        <div className="p-4 border-t border-gray-800 bg-gray-900">
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center space-x-2 shadow-lg shadow-indigo-900/20 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            <span>New Conversation</span>
          </button>
        </div>
      </div>

      {isCreateModalOpen && <CreateChatModal onClose={() => setIsCreateModalOpen(false)} />}
    </>
  );
};

export default Sidebar;
