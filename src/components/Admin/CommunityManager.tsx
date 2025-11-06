import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { CityPopup } from '../../types';
import { Trash2, RefreshCw, Loader2, WifiOff } from 'lucide-react';

const CommunityManager: React.FC = () => {
  const [popups, setPopups] = useState<CityPopup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPopups = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    // Step 1: Fetch all popups
    const { data: popupsData, error: popupsError } = await supabase
      .from('city_popups')
      .select('*')
      .order('created_at', { ascending: false });

    if (popupsError) {
      setError(popupsError.message);
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
      .select('id, full_name, avatar_url')
      .in('id', creatorIds);

    if (profilesError) {
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
  }, []);

  useEffect(() => {
    fetchPopups();
  }, [fetchPopups]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this community popup?')) {
      const { error: deleteError } = await supabase.from('city_popups').delete().eq('id', id);
      if (deleteError) {
        setError(deleteError.message);
      } else {
        fetchPopups();
      }
    }
  };

  return (
    <div className="p-6 bg-gray-100 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-medium text-gray-800">Community Popups Manager</h2>
        <button onClick={fetchPopups} disabled={loading} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 disabled:opacity-50">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
      ) : error ? (
        <div className="text-center py-12 text-red-500 flex flex-col items-center">
          <WifiOff className="w-12 h-12 mb-4 text-red-400" />
          <h3 className="text-lg font-semibold">Could not load data</h3>
          <p className="text-sm max-w-sm">{error}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {popups.map(popup => (
            <motion.div
              key={popup.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between"
            >
              <div>
                <p className="font-medium">{popup.type}: {popup.destination}</p>
                <p className="text-sm text-gray-600">by {popup.creator?.full_name || 'Unknown User'}</p>
                <p className="text-xs text-gray-400">Created: {new Date(popup.created_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => handleDelete(popup.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full">
                <Trash2 className="w-5 h-5" />
              </button>
            </motion.div>
          ))}
          {popups.length === 0 && <p className="text-center text-gray-500 py-10">No community popups found.</p>}
        </div>
      )}
    </div>
  );
};

export default CommunityManager;
