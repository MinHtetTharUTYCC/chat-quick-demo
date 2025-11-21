
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { X, Users, UserPlus, Check, Search } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';

interface CreateChatModalProps {
  onClose: () => void;
}

const CreateChatModal: React.FC<CreateChatModalProps> = ({ onClose }) => {
  const { allUsers, createChat } = useChat();
  const { user: currentUser } = useAuth();
  const [mode, setMode] = useState<'dm' | 'group'>('dm');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const toggleUser = (id: string) => {
    if (mode === 'dm') {
      setSelectedUserIds([id]);
    } else {
      setSelectedUserIds(prev => 
        prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
      );
    }
  };

  const handleSubmit = () => {
    if (selectedUserIds.length === 0) return;
    if (mode === 'group' && !groupName.trim()) return;

    createChat(selectedUserIds, mode, groupName);
    onClose();
  };

  const filteredUsers = allUsers
    .filter(u => u.id !== currentUser?.id)
    .filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-850">
          <h2 className="text-lg font-semibold text-white">New Conversation</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="p-4 flex space-x-2">
          <button 
            onClick={() => { setMode('dm'); setSelectedUserIds([]); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center space-x-2 ${mode === 'dm' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Direct Message</span>
          </button>
          <button 
            onClick={() => { setMode('group'); setSelectedUserIds([]); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center space-x-2 ${mode === 'group' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            <Users className="w-4 h-4" />
            <span>Group Chat</span>
          </button>
        </div>

        {/* Group Name Input */}
        {mode === 'group' && (
          <div className="px-4 pb-2 animate-in slide-in-from-top-2 duration-200">
            <label className="block text-xs font-medium text-gray-400 mb-1">Group Name</label>
            <input 
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. NestJS Team"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        )}

        {/* User Search */}
        <div className="px-4 pt-2 pb-2">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
             <input 
                type="text" 
                placeholder="Search people..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800 border border-transparent focus:border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none"
             />
           </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filteredUsers.map(u => {
            const isSelected = selectedUserIds.includes(u.id);
            return (
              <div 
                key={u.id}
                onClick={() => toggleUser(u.id)}
                className={`p-3 rounded-xl flex items-center space-x-3 cursor-pointer transition-all border ${isSelected ? 'bg-indigo-900/20 border-indigo-500/50' : 'hover:bg-gray-800 border-transparent'}`}
              >
                <div className="relative">
                  <img src={u.avatar} alt="" className="w-10 h-10 rounded-full object-cover bg-gray-700" />
                  {isSelected && (
                    <div className="absolute -bottom-1 -right-1 bg-indigo-500 text-white rounded-full p-0.5 border-2 border-gray-900">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                    <h4 className={`text-sm font-medium ${isSelected ? 'text-indigo-200' : 'text-gray-200'}`}>{u.username}</h4>
                    <p className="text-xs text-gray-500 truncate">@{u.id} • {u.status === 'ONLINE' ? 'Online' : 'Offline'}</p>
                </div>
              </div>
            );
          })}
          {filteredUsers.length === 0 && (
             <div className="text-center py-8 text-gray-500 text-sm">
                 No users found
             </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-850">
          <button 
            onClick={handleSubmit}
            disabled={selectedUserIds.length === 0 || (mode === 'group' && !groupName)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-indigo-900/20"
          >
            {mode === 'dm' ? 'Start Chat' : `Create Group (${selectedUserIds.length})`}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CreateChatModal;
