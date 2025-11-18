import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { City } from '../../types';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';

interface CityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  city: City | null;
  isStrangerCity?: boolean;
}

const CityFormModal: React.FC<CityFormModalProps> = ({ isOpen, onClose, onSuccess, city, isStrangerCity = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    state: '',
    country: '',
    description: '',
    image_url: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (city) {
      setFormData({
        name: city.name,
        state: city.state || '',
        country: city.country || '',
        description: city.description || '',
        image_url: city.image_url || '',
      });
    } else {
      setFormData({ name: '', state: '', country: '', description: '', image_url: '' });
    }
  }, [city, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const cityData = {
      ...formData,
      is_stranger_city: isStrangerCity,
    };

    let error;
    if (city) {
      const { error: updateError } = await supabase.from('cities').update(cityData).eq('id', city.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('cities').insert(cityData);
      error = insertError;
    }

    if (error) {
      console.error('Error saving city:', error);
      toast.error(`Failed to save city: ${error.message}`);
    } else {
      toast.success(`City ${city ? 'updated' : 'created'} successfully!`);
      onSuccess();
    }

    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">{city ? 'Edit' : 'Add'} City</h2>
           <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700">State</label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country</label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label htmlFor="image_url" className="block text-sm font-medium text-gray-700">Image URL</label>
            <input
              type="url"
              id="image_url"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div className="pt-4 flex justify-end gap-4">
            <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 font-semibold">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold min-w-[90px]">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CityFormModal;
