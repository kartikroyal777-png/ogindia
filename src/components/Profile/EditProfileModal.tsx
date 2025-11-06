import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, User, AtSign } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface EditProfileModalProps {
  onClose: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ onClose }) => {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || user?.user_metadata?.full_name || '');
  const [igLink, setIgLink] = useState(profile?.ig_link || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setMessage('');
    
    // Update the public profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: fullName, ig_link: igLink })
      .eq('id', user.id);

    // Also update the auth user metadata for consistency
    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: fullName }
    });

    const error = profileError || authError;

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Profile updated successfully!');
      await refreshProfile();
      setTimeout(() => {
        onClose();
      }, 1500);
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Edit Profile</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm text-gray-700 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Your full name"
              />
            </div>
          </div>
          <div>
            <label htmlFor="igLink" className="block text-sm text-gray-700 mb-2">Instagram Link</label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="igLink"
                type="text"
                value={igLink}
                onChange={(e) => setIgLink(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g., https://instagram.com/username"
              />
            </div>
          </div>
          <motion.button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-orange-600 disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {loading ? 'Updating...' : 'Save Changes'}
          </motion.button>
          {message && <p className={`text-sm text-center mt-4 ${message.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>{message}</p>}
        </form>
      </motion.div>
    </motion.div>
  );
};

export default EditProfileModal;
