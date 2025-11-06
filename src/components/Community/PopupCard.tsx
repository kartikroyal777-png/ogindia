import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, Heart, Shield, AtSign, MessageSquare, Check, Loader2 } from 'lucide-react';
import { CityPopup } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface PopupCardProps {
  popup: CityPopup;
}

const PopupCard: React.FC<PopupCardProps> = ({ popup }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

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
    setJoinSuccess(null);

    try {
      const { data, error } = await supabase.functions.invoke('join-popup', {
        body: { popup_id: popup.id },
      });

      if (error) throw error;
      
      setJoinSuccess(data.chat_id);
      // Optionally navigate to chat right away
      setTimeout(() => navigate(`/chat/${data.chat_id}`), 1000);

    } catch (err: any) {
      setJoinError(err.message || "Failed to join popup.");
    } finally {
      setIsJoining(false);
    }
  };
  
  const handleChat = () => {
    // This logic needs to be improved. We need to know the chat ID.
    // For now, we assume if a user has joined, they can chat.
    // The chat ID should be fetched or stored upon joining.
    if (joinSuccess) {
      navigate(`/chat/${joinSuccess}`);
    } else {
      alert("You need to join the popup first to chat.");
    }
  };

  const isCreator = user?.id === popup.creator_id;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <img src={popup.creator?.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${popup.creator?.full_name || 'A'}`} alt={popup.creator?.full_name || 'User'} className="w-10 h-10 rounded-full object-cover bg-gray-200" />
          <div>
            <p className="font-semibold text-gray-800">{popup.creator?.full_name || 'An Explorer'}</p>
            {igUsername && (
              <a href={popup.creator?.ig_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center space-x-1">
                <AtSign className="w-3 h-3" />
                <span>{igUsername}</span>
              </a>
            )}
          </div>
        </div>
        <div className="flex space-x-1">
          {popup.allow_friendship && <Users className="w-4 h-4 text-blue-500" title="Open to Friendship" />}
          {popup.allow_dating && <Heart className="w-4 h-4 text-red-500" title="Open to Dating" />}
          {popup.gender_pref === 'females_only' && <Shield className="w-4 h-4 text-pink-500" title="Females Only" />}
        </div>
      </div>
      <div>
        <h3 className="font-bold text-lg">{popup.type}: {popup.destination}</h3>
        <p className="text-sm text-gray-600 line-clamp-2">{popup.description}</p>
      </div>
      <div className="flex justify-between items-center text-sm text-gray-500 border-t pt-3">
        <div className="flex items-center space-x-1">
          <Clock className="w-4 h-4" />
          <span>{timeUntil}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Users className="w-4 h-4" />
          <span>{popup.seats_available} seats left</span>
        </div>
      </div>
      <div className="flex space-x-2">
        <motion.button 
          onClick={handleJoin}
          disabled={isJoining || isCreator || popup.seats_available <= 0 || !!joinSuccess}
          className="w-full py-2 bg-orange-500 text-white font-semibold rounded-lg text-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed" 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }}
        >
          {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : joinSuccess ? <Check className="w-4 h-4" /> : 'Join'}
        </motion.button>
        <motion.button 
          onClick={handleChat}
          disabled={!joinSuccess && !isCreator} // Simplified logic
          className="w-full py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg text-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed" 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Chat
        </motion.button>
      </div>
      {joinError && <p className="text-xs text-red-500 text-center mt-2">{joinError}</p>}
    </div>
  );
};

export default PopupCard;
