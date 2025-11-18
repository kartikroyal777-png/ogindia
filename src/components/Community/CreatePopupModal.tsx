import { useState } from 'react';
import { X, MapPin, Calendar, Users, DollarSign, Heart, Handshake } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface CreatePopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPopupCreated: () => void;
  cityId: string;
}

export const CreatePopupModal = ({ isOpen, onClose, onPopupCreated, cityId }: CreatePopupModalProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [destination, setDestination] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxAttendees, setMaxAttendees] = useState(2);
  const [genderPref, setGenderPref] = useState('any');
  const [allowDating, setAllowDating] = useState(false);
  const [allowFriendship, setAllowFriendship] = useState(true);
  const [price, setPrice] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in to create a popup.");
      return;
    }
    if (new Date(startTime) >= new Date(endTime)) {
      toast.error("End time must be after start time.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const { error: rpcError } = await supabase.rpc('create_popup_with_chat', {
        p_title: title,
        p_city_id: cityId,
        p_creator_id: user.id,
        p_description: description,
        p_destination: destination,
        p_start_time: new Date(startTime).toISOString(),
        p_end_time: new Date(endTime).toISOString(),
        p_max_attendees: maxAttendees,
        p_gender_preference: genderPref,
        p_open_to_dating: allowDating,
        p_open_to_friendship: allowFriendship,
        p_price: price,
      });

      if (rpcError) throw rpcError;

      toast.success("Popup created successfully!");
      onPopupCreated();
      onClose();
    } catch (err: any) {
      console.error('Error creating popup:', err);
      setError(err.message || 'Failed to create popup. Please try again.');
      toast.error(err.message || 'Failed to create popup.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const InputField = ({ icon: Icon, label, children }: { icon: React.ElementType, label: string, children: React.ReactNode }) => (
    <div className="relative">
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <div className="relative mt-1">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
        {children}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[95vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Create a New Plan</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">{error}</div>}
          
          <input
            type="text"
            placeholder="e.g., Sunset Hike at the Fort"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full p-3 text-lg font-semibold border-b-2 border-gray-200 focus:outline-none focus:border-orange-500 transition-colors"
          />

          <textarea
            placeholder="Describe the plan, what to expect, and what to bring..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            className="w-full p-3 border-b-2 border-gray-200 focus:outline-none focus:border-orange-500 transition-colors resize-none"
          />

          <InputField icon={MapPin} label="Destination / Meetup Point">
            <input
              type="text"
              placeholder="e.g., Main entrance of City Palace"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
              className="w-full pl-10 p-2.5 border-b-2 border-gray-200 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </InputField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField icon={Calendar} label="Starts At">
              <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full pl-10 p-2.5 border-b-2 border-gray-200 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </InputField>
            <InputField icon={Calendar} label="Ends At">
              <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full pl-10 p-2.5 border-b-2 border-gray-200 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </InputField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField icon={Users} label="Group Size">
              <select
                value={maxAttendees}
                onChange={(e) => setMaxAttendees(Number(e.target.value))}
                className="w-full pl-10 p-2.5 border-b-2 border-gray-200 focus:outline-none focus:border-orange-500 transition-colors appearance-none bg-white"
              >
                {[...Array(9).keys()].map(n => <option key={n + 2} value={n + 2}>{n + 2} People</option>)}
              </select>
            </InputField>
            <InputField icon={DollarSign} label="Contribution (INR)">
               <input
                type="number"
                placeholder="0 for free"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                min="0"
                className="w-full pl-10 p-2.5 border-b-2 border-gray-200 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </InputField>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Gender Preference</label>
            <div className="flex flex-wrap gap-2">
              {['any', 'male', 'female'].map(pref => (
                <button
                  key={pref}
                  type="button"
                  onClick={() => setGenderPref(pref)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${genderPref === pref ? 'bg-orange-500 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {pref.charAt(0).toUpperCase() + pref.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center text-gray-700"><Heart className="mr-3 h-5 w-5 text-red-400" /> Open to Dating</span>
              <div className="relative">
                <input type="checkbox" checked={allowDating} onChange={() => setAllowDating(!allowDating)} className="sr-only" />
                <div className={`block w-12 h-7 rounded-full transition-colors ${allowDating ? 'bg-orange-500' : 'bg-gray-200'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${allowDating ? 'transform translate-x-5' : ''}`}></div>
              </div>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center text-gray-700"><Handshake className="mr-3 h-5 w-5 text-blue-400" /> Open to Friendship</span>
               <div className="relative">
                <input type="checkbox" checked={allowFriendship} onChange={() => setAllowFriendship(!allowFriendship)} className="sr-only" />
                <div className={`block w-12 h-7 rounded-full transition-colors ${allowFriendship ? 'bg-orange-500' : 'bg-gray-200'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${allowFriendship ? 'transform translate-x-5' : ''}`}></div>
              </div>
            </label>
          </div>
        </form>
        <div className="flex justify-end space-x-4 p-4 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
          >
            {isSubmitting ? 'Creating...' : 'Publish Plan'}
          </button>
        </div>
      </div>
    </div>
  );
};
