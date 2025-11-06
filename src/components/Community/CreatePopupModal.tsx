import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';
import { CityPopup, PopupType, GenderPref } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

interface CreatePopupModalProps {
  cityId: string;
  onClose: () => void;
  onCreate: (popup: Partial<CityPopup>) => void;
}

const CreatePopupModal: React.FC<CreatePopupModalProps> = ({ cityId, onClose, onCreate }) => {
  const { profile } = useAuth();
  const [formData, setFormData] = useState<Partial<CityPopup>>({
    city_id: cityId,
    type: 'Meetup',
    destination: '',
    start_time: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16), // Default to 1 hour from now
    seats_available: 2,
    description: '',
    gender_pref: 'all',
    allow_friendship: true,
    allow_dating: false,
  });

  const isProfileComplete = profile?.full_name && profile?.avatar_url && profile?.ig_link;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: name === 'seats_available' ? parseInt(value) : value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isProfileComplete) {
      alert("Please complete your profile first.");
      return;
    }
    onCreate(formData);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Create a Popup</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><X /></button>
        </div>
        
        {!isProfileComplete ? (
          <div className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Complete Your Profile</h3>
            <p className="text-gray-600 my-2">To create a popup, please make sure you have a full name, profile picture, and Instagram link set up.</p>
            <Link to="/profile">
              <motion.button 
                className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg"
                whileHover={{ scale: 1.05 }}
              >
                Go to Profile
              </motion.button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
            <div>
              <label className="text-sm font-medium">Type</label>
              <select name="type" value={formData.type} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg bg-gray-50">
                <option>Meetup</option>
                <option>Trip</option>
                <option>Photo Walk</option>
                <option>Dinner</option>
                <option>Temple Visit</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Destination</label>
              <input name="destination" value={formData.destination} onChange={handleChange} placeholder="e.g., Amer Fort" className="w-full mt-1 p-2 border rounded-lg" required />
            </div>
            <div>
              <label className="text-sm font-medium">Start Time</label>
              <input name="start_time" type="datetime-local" value={formData.start_time} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg" required />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="What's the plan?" className="w-full mt-1 p-2 border rounded-lg" rows={3}></textarea>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Seats Available</label>
                <input name="seats_available" type="number" min="1" value={formData.seats_available} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg" />
              </div>
              <div>
                <label className="text-sm font-medium">Gender Preference</label>
                <select name="gender_pref" value={formData.gender_pref as GenderPref} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg bg-gray-50">
                  <option value="all">All Genders</option>
                  <option value="females_only">Females Only</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">I'm open to:</label>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="friendship" name="allow_friendship" checked={formData.allow_friendship} onChange={handleChange} className="h-4 w-4 text-orange-600 border-gray-300 rounded" />
                <label htmlFor="friendship" className="text-sm">Friendship</label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="dating" name="allow_dating" checked={formData.allow_dating} onChange={handleChange} className="h-4 w-4 text-orange-600 border-gray-300 rounded" />
                <label htmlFor="dating" className="text-sm">Personal Connections (Dating)</label>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-lg">Create Popup</button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
};

export default CreatePopupModal;
