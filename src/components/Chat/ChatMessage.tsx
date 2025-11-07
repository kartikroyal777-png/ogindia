import { ChatMessage as ChatMessageType } from '../../types';
import { format } from 'date-fns';
import { MapPin, Image as ImageIcon } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
  currentUserId?: string;
}

const ChatMessage = ({ message, currentUserId }: ChatMessageProps) => {
  const isCurrentUser = message.user_id === currentUserId;
  const userProfile = message.profiles;

  const renderContent = () => {
    if (message.content) {
      return <p className="text-sm">{message.content}</p>;
    }
    if (message.image_url) {
      return (
        <a href={message.image_url} target="_blank" rel="noopener noreferrer">
          <img src={message.image_url} alt="Shared content" className="rounded-lg max-w-xs cursor-pointer" />
        </a>
      );
    }
    if (message.location_data) {
      const { lat, lng } = message.location_data;
      return (
        <a 
          href={`https://www.google.com/maps?q=${lat},${lng}`} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center space-x-2 text-blue-400 hover:underline"
        >
          <MapPin size={16} />
          <span>Shared Location</span>
        </a>
      );
    }
    return null;
  };

  return (
    <div className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      {!isCurrentUser && (
        <img
          src={userProfile?.avatar_url || `https://api.dicebear.com/8.x/bottts/svg?seed=${userProfile?.username}`}
          alt={userProfile?.username}
          className="w-8 h-8 rounded-full"
        />
      )}
      <div
        className={`max-w-md lg:max-w-lg p-3 rounded-2xl ${
          isCurrentUser
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-gray-700 text-gray-200 rounded-bl-none'
        }`}
      >
        {!isCurrentUser && (
          <p className="text-xs font-bold text-teal-300 mb-1">{userProfile?.username || 'User'}</p>
        )}
        {renderContent()}
        <p className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-200' : 'text-gray-400'} text-right`}>
          {format(new Date(message.created_at), 'p')}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;
