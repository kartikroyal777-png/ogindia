import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, User, Loader2, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Profile } from '../types';

interface Message {
  id: number;
  content: string;
  created_at: string;
  user_id: string;
  sender?: Profile;
}

interface Participant {
  user_id: string;
  profiles: Profile;
}

const ChatPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatId) return;

    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);

      // Fetch participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('chat_participants')
        .select('user_id, profiles(id, full_name, avatar_url)')
        .eq('chat_id', chatId);

      if (participantsError) {
        setError(`Failed to fetch participants: ${participantsError.message}`);
        setLoading(false);
        return;
      }
      setParticipants(participantsData as Participant[]);
      const profilesMap = new Map(participantsData.map(p => [p.user_id, p.profiles]));

      // Fetch initial messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        setError(`Failed to fetch messages: ${messagesError.message}`);
      } else {
        const messagesWithSenders = messagesData.map(msg => ({
          ...msg,
          sender: profilesMap.get(msg.user_id)
        }));
        setMessages(messagesWithSenders);
      }
      setLoading(false);
    };

    fetchInitialData();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat_${chatId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `chat_id=eq.${chatId}` },
        async (payload) => {
          const newMsg = payload.new as Message;
          // Fetch sender profile for the new message
          const { data: profileData } = await supabase.from('profiles').select('id, full_name, avatar_url').eq('id', newMsg.user_id).single();
          setMessages(prev => [...prev, { ...newMsg, sender: profileData || undefined }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !chatId) return;

    const content = newMessage.trim();
    setNewMessage('');

    const { error } = await supabase
      .from('chat_messages')
      .insert({ chat_id: chatId, user_id: user.id, content });

    if (error) {
      console.error("Error sending message:", error);
      // Optionally show an error to the user
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }
  
  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center space-x-4">
        <Link to={-1 as any} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-800" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Group Chat</h1>
          <div className="flex items-center -space-x-2">
            {participants.slice(0, 5).map(p => (
              <img key={p.user_id} src={p.profiles?.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${p.profiles?.full_name || 'A'}`} alt={p.profiles?.full_name || ''} className="w-6 h-6 rounded-full border-2 border-white" />
            ))}
            {participants.length > 5 && <span className="text-xs pl-3 text-gray-500">+{participants.length - 5} more</span>}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex items-start space-x-2">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>You are in a temporary group chat for this popup. Be respectful and stay safe. Meet in public places.</p>
        </div>
        {messages.map(msg => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-end space-x-2 max-w-[85%] ${msg.user_id === user?.id ? 'ml-auto flex-row-reverse space-x-reverse' : ''}`}
          >
            <img src={msg.sender?.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${msg.sender?.full_name || 'A'}`} alt={msg.sender?.full_name || ''} className="w-8 h-8 rounded-full object-cover bg-gray-200 mb-1" />
            <div>
              {msg.user_id !== user?.id && <p className="text-xs text-gray-500 mb-0.5 ml-2">{msg.sender?.full_name || 'User'}</p>}
              <div className={`px-4 py-2 rounded-2xl ${msg.user_id === user?.id ? 'bg-orange-500 text-white rounded-br-none' : 'bg-white text-gray-900 rounded-bl-none shadow-sm'}`}>
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      <footer className="bg-white p-4 border-t sticky bottom-0">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <motion.button type="submit" className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center" whileTap={{ scale: 0.9 }}>
            <Send className="w-5 h-5" />
          </motion.button>
        </form>
      </footer>
    </div>
  );
};

export default ChatPage;
