import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, Heart, Shield, AtSign, MessageSquare, Check, Loader2, Venus, Mars, IndianRupee } from 'lucide-react';
import { CityPopup } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface PopupCardProps {
  popup: CityPopup;
  isJoined: boolean;
  onJoinSuccess: () => void;
}

const PopupCard: React.FC<PopupCardProps> = ({ popup, isJoined, onJoinSuccess }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(isJoined);

  useEffect(() => {
    setHasJoined(isJoined);
  }, [isJoined]);

  const timeUntil = new Date(popup.start_time).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const getIgUsername = (url: string | undefined) => {
    if (!url) return null;
    try {
      const parts = url.split('/').filter(Boolean);
      return parts.pop() || null;
    } catch (e) {
      return null;
    }
  };

  const igUsername = getIgUsername(popup.creator?.ig_link);

  const handleJoin = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setIsJoining(true);
    setJoinError(null);

    try {
      const { data, error } = await supabase.functions.invoke('join-popup', {
        body: { popup_id: popup.id },
      });

      if (error) throw error;
      
      setHasJoined(true);
      onJoinSuccess();
      setTimeout(() => navigate(`/chat/${data.chat_id}`), 1000);

    } catch (err: any) {
      setJoinError(err.message || "Failed to join popup.");
    } finally {
      setIsJoining(false);
    }
  };
  
  const handleChat = () => {
    const chatId = popup.chat_groups?.[0]?.id;
    if ((hasJoined || isCreator) && chatId) {
        navigate(`/chat/${chatId}`);
    } else {
        setJoinError("You need to join the popup to chat, or the chat group is not available.");
    }
  };

  const isCreator = user?.id === popup.creator_id;

  return (
    <motion.div 
        className="bg-white rounded-2xl shadow-sm border p-4 space-y-4 hover:shadow-lg transition-shadow flex flex-col"
        whileHover={{ y: -5 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <img src={popup.creator?.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${popup.creator?.full_name || 'A'}`} alt={popup.creator?.full_name || 'User'} className="w-12 h-12 rounded-full object-cover bg-gray-200" />
          <div>
            <p className="font-medium text-gray-800">{popup.creator?.full_name || 'An Explorer'}</p>
            {igUsername && (
              <a href={popup.creator?.ig_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center space-x-1">
                <AtSign className="w-3 h-3" />
                <span>{igUsername}</span>
              </a>
            )}
          </div>
        </div>
        <div className="flex space-x-1.5">
          {popup.allow_friendship && <Users className="w-4 h-4 text-blue-500" title="Open to Friendship" />}
          {popup.allow_dating && <Heart className="w-4 h-4 text-red-500" title="Open to Dating" />}
          {popup.gender_pref === 'females_only' && <Venus className="w-4 h-4 text-pink-500" title="Females Only" />}
          {popup.gender_pref === 'males_only' && <Mars className="w-4 h-4 text-sky-500" title="Males Only" />}
        </div>
      </div>
      <div>
        <h3 className="font-medium text-lg">{popup.type}: {popup.title}</h3>
        <p className="text-sm text-gray-500 font-medium">📍 {popup.destination}</p>
        <p className="text-sm text-gray-600 line-clamp-2 mt-1">{popup.description}</p>
      </div>
      <div className="flex-grow"></div>
      <div className="flex justify-between items-center text-sm text-gray-500 border-t pt-3">
        <div className="flex items-center space-x-1">
          <Clock className="w-4 h-4" />
          <span>{timeUntil}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Users className="w-4 h-4" />
          <span>{popup.max_attendees - (popup.chat_groups?.[0]?.id ? 1 : 0)} seats left</span>
        </div>
        {popup.price && (
            <div className="flex items-center space-x-1 font-medium text-green-600">
                <IndianRupee className="w-4 h-4" />
                <span>{popup.price}</span>
            </div>
        )}
      </div>
      <div className="flex space-x-2">
        <motion.button 
          onClick={handleJoin}
          disabled={isJoining || isCreator || (popup.max_attendees - (popup.chat_groups?.[0]?.id ? 1 : 0)) <= 0 || hasJoined}
          className="w-full py-2.5 bg-orange-500 text-white font-medium rounded-lg text-sm flex items-center justify-center disabled:bg-orange-300 disabled:cursor-not-allowed" 
          whileHover={{ scale: (isJoining || isCreator || hasJoined) ? 1 : 1.02 }} 
          whileTap={{ scale: (isJoining || isCreator || hasJoined) ? 1 : 0.98 }}
        >
          {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : hasJoined ? <Check className="w-4 h-4" /> : 'Join'}
        </motion.button>
        <motion.button 
          onClick={handleChat}
          disabled={!hasJoined && !isCreator}
          className="w-full py-2.5 bg-gray-200 text-gray-800 font-medium rounded-lg text-sm flex items-center justify-center disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed" 
          whileHover={{ scale: (!hasJoined && !isCreator) ? 1 : 1.02 }} 
          whileTap={{ scale: (!hasJoined && !isCreator) ? 1 : 0.98 }}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Chat
        </motion.button>
      </div>
      {joinError && <p className="text-xs text-red-500 text-center mt-2">{joinError}</p>}
    </motion.div>
  );
};

export default PopupCard;
