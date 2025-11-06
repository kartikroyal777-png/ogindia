import React, { useState, useEffect } from 'react';
import { ArrowLeft, PlusCircle, Users, Loader2, WifiOff, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { CityPopup, Profile, City } from '../types';
import PopupCard from '../components/Community/PopupCard';
import CreatePopupModal from '../components/Community/CreatePopupModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const CityPopupsPage: React.FC = () => {
  const { cityId } = useParams<{ cityId: string }>();
  const { user } = useAuth();
  const [city, setCity] = useState<City | null>(null);
  const [popups, setPopups] = useState<CityPopup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!cityId) return;

    const fetchCityAndPopups = async () => {
      setLoading(true);
      setError(null);

      // Fetch city details
      const { data: cityData, error: cityError } = await supabase.from('cities').select('*').eq('id', cityId).single();
      if (cityError) {
        setError(`Could not load city details: ${cityError.message}`);
        setLoading(false);
        return;
      }
      setCity(cityData);

      // Fetch popups for this city
      const { data: popupsData, error: popupsError } = await supabase
        .from('city_popups')
        .select('*, creator:profiles(id, full_name, avatar_url, ig_link)')
        .eq('city_id', cityId)
        .ilike('destination', `%${searchQuery}%`)
        .order('created_at', { ascending: false });

      if (popupsError) {
        setError(`Could not fetch popups: ${popupsError.message}`);
      } else {
        setPopups(popupsData as any[] || []);
      }
      setLoading(false);
    };

    const debounce = setTimeout(() => {
      fetchCityAndPopups();
    }, 300);

    return () => clearTimeout(debounce);
  }, [cityId, searchQuery]);

  const handleCreatePopup = async (newPopupData: Partial<CityPopup>) => {
    if (!user || !cityId) return;
    const popupToInsert = { ...newPopupData, creator_id: user.id, city_id: cityId };
    const { data, error: insertError } = await supabase.from('city_popups').insert(popupToInsert).select('*, creator:profiles(*)').single();
    if (insertError) {
      alert(`Failed to create popup: ${insertError.message}`);
    } else if (data) {
      setPopups(prev => [data as any, ...prev]);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white p-4 shadow-sm sticky top-0 z-20 flex items-center space-x-4">
          <Link to="/stranger" className="p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">{city?.name || 'Community'} Popups</h1>
        </div>

        <div className="p-4 sticky top-[72px] bg-gray-50/80 backdrop-blur-sm z-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for a location or activity..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-xl"
            />
          </div>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="flex justify-center p-16"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
          ) : error ? (
            <div className="text-center py-12 text-red-500"><WifiOff className="w-12 h-12 mx-auto mb-2" />{error}</div>
          ) : popups.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold">No Popups Yet</h3>
              <p>Be the first to create a popup in {city?.name}!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {popups.map((popup, index) => (
                <motion.div
                  key={popup.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <PopupCard popup={popup} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      <motion.button
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-24 right-4 w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full shadow-lg flex items-center justify-center z-40"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Create a Popup"
      >
        <PlusCircle className="w-8 h-8" />
      </motion.button>
      <AnimatePresence>
        {isCreateModalOpen && cityId && (
          <CreatePopupModal
            cityId={cityId}
            onClose={() => setIsCreateModalOpen(false)}
            onCreate={handleCreatePopup}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default CityPopupsPage;
