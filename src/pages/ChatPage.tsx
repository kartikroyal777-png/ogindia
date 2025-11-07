import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ChatMessage as ChatMessageType, ChatGroup, Profile } from '../types';
import FullScreenLoader from '../components/Layout/FullScreenLoader';
import { ArrowLeft, Users, MoreVertical } from 'lucide-react';
import ChatMessage from '../components/Chat/ChatMessage';
import MessageInput from '../components/Chat/MessageInput';

const ChatPage = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [groupInfo, setGroupInfo] = useState<ChatGroup | null>(null);
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!chatId) {
      setError('No group ID provided.');
      setLoading(false);
      return;
    }

    const fetchInitialData = async () => {
      try {
        const { data: groupData, error: groupError } = await supabase
          .from('chat_groups')
          .select('*')
          .eq('id', chatId)
          .single();
        if (groupError) throw groupError;
        setGroupInfo(groupData);

        const { data: messageData, error: messageError } = await supabase
          .from('chat_messages')
          .select('*, profiles(*)')
          .eq('group_id', chatId)
          .order('created_at', { ascending: true });
        if (messageError) throw messageError;
        setMessages(messageData as ChatMessageType[]);
        
        const { data: memberData, error: memberError } = await supabase
          .from('chat_group_members')
          .select('profiles(*)')
          .eq('group_id', chatId);
        if (memberError) throw memberError;
        setMembers(memberData.map((m: any) => m.profiles));

      } catch (err: any) {
        console.error('Error fetching chat data:', err);
        setError('Failed to load chat. You may not be a member of this group.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    const messageSubscription = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `group_id=eq.${chatId}` },
        async (payload) => {
          const newMessage = payload.new as ChatMessageType;
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newMessage.user_id)
            .single();
          if (profileData) {
            newMessage.profiles = profileData;
          }
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageSubscription);
    };
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (loading) return <FullScreenLoader />;
  if (error) return <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white"><p className="text-red-400">{error}</p><button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-blue-600 rounded-lg">Go Back</button></div>;

  return (
    <div className="h-screen w-screen bg-gray-800 flex flex-col" style={{ backgroundImage: "url('/background-pattern.png')", backgroundSize: '300px', backgroundRepeat: 'repeat' }}>
      <header className="bg-gray-900 bg-opacity-80 backdrop-blur-sm shadow-md p-3 flex items-center justify-between z-10">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="text-gray-300 hover:text-white mr-3">
            <ArrowLeft size={24} />
          </button>
          <div className="flex-grow">
            <h1 className="text-lg font-bold text-white truncate">{groupInfo?.name}</h1>
            <p className="text-xs text-gray-400 flex items-center">
              <Users size={12} className="mr-1" />
              {members.length} Members
            </p>
          </div>
        </div>
        <button className="text-gray-300 hover:text-white">
          <MoreVertical size={24} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} currentUserId={user?.id} />
          ))}
        </div>
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-2 bg-gray-900 bg-opacity-50 backdrop-blur-sm">
        {chatId && profile && <MessageInput groupId={chatId} userProfile={profile} />}
      </footer>
    </div>
  );
};

export default ChatPage;
