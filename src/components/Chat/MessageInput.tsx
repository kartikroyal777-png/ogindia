import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Profile } from '../../types';
import { Send, Paperclip, MapPin, Image as ImageIcon } from 'lucide-react';

interface MessageInputProps {
  groupId: string;
  userProfile: Profile;
}

const MessageInput = ({ groupId, userProfile }: MessageInputProps) => {
  const [content, setContent] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = async () => {
    if (!content.trim()) return;
    const trimmedContent = content.trim();
    setContent('');

    await supabase.from('chat_messages').insert({
      group_id: groupId,
      user_id: userProfile.id,
      content: trimmedContent,
    });
  };

  const handleSendLocation = () => {
    setShowAttachments(false);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        await supabase.from('chat_messages').insert({
          group_id: groupId,
          user_id: userProfile.id,
          location_data: { lat: latitude, lng: longitude },
        });
      }, (err) => {
        console.error("Error getting location:", err);
        alert("Could not get your location. Please enable location services.");
      });
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };
  
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowAttachments(false);
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${userProfile.id}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('chat_assets')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      alert('Failed to upload image.');
      return;
    }

    const { data } = supabase.storage.from('chat_assets').getPublicUrl(filePath);
    
    if (data.publicUrl) {
      await supabase.from('chat_messages').insert({
        group_id: groupId,
        user_id: userProfile.id,
        image_url: data.publicUrl,
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="relative">
      {showAttachments && (
        <div className="absolute bottom-14 left-2 flex flex-col space-y-2 bg-gray-700 p-2 rounded-lg shadow-lg animate-fade-in-up-fast">
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center w-full text-left p-2 hover:bg-gray-600 rounded-md text-gray-200"><ImageIcon size={20} className="mr-3"/> Image</button>
          <button onClick={handleSendLocation} className="flex items-center w-full text-left p-2 hover:bg-gray-600 rounded-md text-gray-200"><MapPin size={20} className="mr-3"/> Location</button>
        </div>
      )}
      <div className="flex items-center space-x-2">
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
        <button onClick={() => setShowAttachments(!showAttachments)} className="p-2 text-gray-400 hover:text-white transition-colors">
          <Paperclip size={24} />
        </button>
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button onClick={handleSendMessage} className="bg-blue-600 text-white rounded-full p-3 hover:bg-blue-700 transition-colors disabled:bg-gray-500" disabled={!content.trim()}>
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
