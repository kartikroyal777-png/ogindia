import React, { useState, useEffect } from 'react';
import { ArrowLeft, PlusCircle, Users, Loader2, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CityPopup, Profile } from '../types';
import PopupCard from '../components/Community/PopupCard';
import CreatePopupModal from '../components/Community/CreatePopupModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const CommunityPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [popups, setPopups] = useState<CityPopup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const fetchPopups = async () => {
      setLoading(true);
      setError(null);

      // Step 1: Fetch all popups
      const { data: popupsData, error: popupsError } = await supabase
        .from('city_popups')
        .select('*')
        .order('created_at', { ascending: false });

      if (popupsError) {
        setError(`Could not fetch community popups: ${popupsError.message}`);
        console.error(popupsError);
        setLoading(false);
        return;
      }

      if (!popupsData || popupsData.length === 0) {
        setPopups([]);
        setLoading(false);
        return;
      }

      // Step 2: Get unique creator IDs
      const creatorIds = [...new Set(popupsData.map(p => p.creator_id).filter(Boolean))];

      if (creatorIds.length === 0) {
        setPopups(popupsData as CityPopup[]);
        setLoading(false);
        return;
      }

      // Step 3: Fetch profiles for those creators
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, ig_link')
        .in('id', creatorIds);

      if (profilesError) {
        // Still show popups, just without creator info if profiles fail
        setError(`Could not fetch creator profiles: ${profilesError.message}`);
        setPopups(popupsData as CityPopup[]);
        setLoading(false);
        return;
      }

      // Step 4: Combine the data
      const profilesMap = new Map(profilesData.map(p => [p.id, p]));
      const combinedData = popupsData.map(popup => ({
        ...popup,
        creator: profilesMap.get(popup.creator_id) || null
      }));

      setPopups(combinedData as CityPopup[]);
      setLoading(false);
    };

    fetchPopups();
  }, []);

  const handleCreatePopup = async (newPopupData: Partial<CityPopup>) => {
    if (!user || !profile) {
      alert('You must be logged in to create a popup.');
      return;
    }

    const popupToInsert = {
      ...newPopupData,
      creator_id: user.id,
      expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // Expires in 8 hours
    };

    const { data: insertedPopup, error: insertError } = await supabase
      .from('city_popups')
      .insert(popupToInsert)
      .select('*')
      .single();

    if (insertError || !insertedPopup) {
      alert(`Failed to create popup: ${insertError?.message}`);
    } else {
      const newPopupWithCreator: CityPopup = {
        ...(insertedPopup as CityPopup),
        creator: profile,
      };
      setPopups(prev => [newPopupWithCreator, ...prev]);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center space-x-4">
          <Link to="/" className="p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Community</h1>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="flex justify-center p-16"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
          ) : error ? (
            <div className="text-center py-12 text-red-500"><WifiOff className="w-12 h-12 mx-auto mb-2" />{error}</div>
          ) : popups.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold">It's quiet here...</h3>
              <p>Be the first to create a popup and start an adventure!</p>
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
        {isCreateModalOpen && (
          <CreatePopupModal
            onClose={() => setIsCreateModalOpen(false)}
            onCreate={handleCreatePopup}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default CommunityPage;
