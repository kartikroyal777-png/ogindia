import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { City } from '../../types';
import { X, Users, Tag, Heart, Handshake } from 'lucide-react';

interface CreatePopupModalProps {
  city: City;
  onClose: () => void;
  onSuccess: () => void;
}

const CreatePopupModal = ({ city, onClose, onSuccess }: CreatePopupModalProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxAttendees, setMaxAttendees] = useState(10);
  const [genderPreference, setGenderPreference] = useState('any');
  const [openToDating, setOpenToDating] = useState(false);
  const [openToFriendship, setOpenToFriendship] = useState(true);
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreatePopup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to create a popup.');
      return;
    }
    if (!title || !description || !startTime || !endTime) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: rpcError } = await supabase.rpc('create_popup_with_chat', {
        p_city_id: city.id,
        p_title: title,
        p_description: description,
        p_start_time: startTime,
        p_end_time: endTime,
        p_max_attendees: maxAttendees,
        p_gender_preference: genderPreference,
        p_open_to_dating: openToDating,
        p_open_to_friendship: openToFriendship,
        p_price: price ? parseFloat(price) : null,
      });

      if (rpcError) {
        throw rpcError;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating popup via RPC:', err);
      setError(err.message || 'An unexpected error occurred while creating the popup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 relative animate-fade-in-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-white mb-2">Create a Popup in {city.name}</h2>
        <p className="text-gray-400 mb-6">Share your plans and meet new people!</p>
        
        <form onSubmit={handleCreatePopup} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Title</label>
            <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_time" className="block text-sm font-medium text-gray-300 mb-1">Start Time</label>
              <input type="datetime-local" id="start_time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="end_time" className="block text-sm font-medium text-gray-300 mb-1">End Time</label>
              <input type="datetime-local" id="end_time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="maxAttendees" className="flex items-center text-sm font-medium text-gray-300 mb-1"><Users size={16} className="mr-2"/>Max Attendees</label>
              <input type="number" id="maxAttendees" value={maxAttendees} onChange={(e) => setMaxAttendees(parseInt(e.target.value))} min="2" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="price" className="flex items-center text-sm font-medium text-gray-300 mb-1"><Tag size={16} className="mr-2"/>Price (Optional)</label>
              <input type="number" id="price" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g., 10.00" step="0.01" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Gender Preference</label>
            <div className="flex space-x-4">
              <label className="flex items-center text-gray-300"><input type="radio" name="gender" value="any" checked={genderPreference === 'any'} onChange={() => setGenderPreference('any')} className="mr-2 accent-blue-500"/> Any</label>
              <label className="flex items-center text-gray-300"><input type="radio" name="gender" value="male" checked={genderPreference === 'male'} onChange={() => setGenderPreference('male')} className="mr-2 accent-blue-500"/> Male Only</label>
              <label className="flex items-center text-gray-300"><input type="radio" name="gender" value="female" checked={genderPreference === 'female'} onChange={() => setGenderPreference('female')} className="mr-2 accent-blue-500"/> Female Only</label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Open To</label>
            <div className="flex space-x-6">
              <label className="flex items-center text-gray-300 cursor-pointer"><input type="checkbox" checked={openToFriendship} onChange={(e) => setOpenToFriendship(e.target.checked)} className="mr-2 h-5 w-5 rounded accent-pink-500"/> <Handshake size={18} className="mr-1 text-pink-400"/> Friendship</label>
              <label className="flex items-center text-gray-300 cursor-pointer"><input type="checkbox" checked={openToDating} onChange={(e) => setOpenToDating(e.target.checked)} className="mr-2 h-5 w-5 rounded accent-red-500"/> <Heart size={18} className="mr-1 text-red-400"/> Dating</label>
            </div>
          </div>
          
          {error && <p className="text-red-400 text-sm">{error}</p>}
          
          <div className="pt-2">
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed flex justify-center items-center">
              {loading ? 'Creating...' : 'Create Popup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePopupModal;
