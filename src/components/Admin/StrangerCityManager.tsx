import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { City } from '../../types';
import { Plus, Trash2, Edit, Loader2 } from 'lucide-react';
import CityFormModal from './CityFormModal';
import toast from 'react-hot-toast';

const StrangerCityManager = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('is_stranger_city', true)
      .order('name');
    
    if (error) {
      console.error('Error fetching stranger cities:', error);
      setError('Failed to load cities.');
      toast.error('Failed to load cities.');
    } else {
      setCities(data);
    }
    setLoading(false);
  };

  const handleOpenModal = (city: City | null) => {
    setEditingCity(city);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCity(null);
  };

  const handleSuccess = () => {
    fetchCities();
    handleCloseModal();
  };
  
  const handleDelete = async (cityId: string) => {
    if (window.confirm('Are you sure you want to remove this city from the stranger list? This will not delete the city, but set is_stranger_city to false.')) {
      const { error: updateError } = await supabase
        .from('cities')
        .update({ is_stranger_city: false })
        .eq('id', cityId);
        
      if (updateError) {
        toast.error('Failed to remove city: ' + updateError.message);
      } else {
        toast.success('City removed from stranger list.');
        fetchCities();
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>;
  }

  if (error) {
    return <div className="text-red-500 bg-red-100 p-4 rounded-lg">{error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Stranger Cities</h2>
        <button
          onClick={() => handleOpenModal(null)}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold flex items-center hover:bg-orange-600 transition-colors"
        >
          <Plus className="mr-2 h-5 w-5" />
          Add City
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {cities.map(city => (
            <li key={city.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center">
                <img src={city.image_url || 'https://img-wrapper.vercel.app/image?url=https://placehold.co/64x64.png'} alt={city.name} className="h-12 w-12 rounded-md object-cover mr-4" />
                <div>
                  <p className="font-semibold text-gray-900">{city.name}</p>
                  <p className="text-sm text-gray-500">{city.state}, {city.country}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleOpenModal(city)} className="text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-blue-100 transition-colors">
                  <Edit className="h-5 w-5" />
                </button>
                <button onClick={() => handleDelete(city.id!)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 transition-colors">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
        {cities.length === 0 && <p className="p-6 text-center text-gray-500">No cities found for "Travel with Strangers".</p>}
      </div>

      <CityFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        city={editingCity}
        isStrangerCity={true}
      />
    </div>
  );
};

export default StrangerCityManager;
