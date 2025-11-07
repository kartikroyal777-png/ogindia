import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { City, CityPopup } from '../types';
import PopupCard from '../components/Community/PopupCard';
import CreatePopupModal from '../components/Community/CreatePopupModal';
import { useAuth } from '../contexts/AuthContext';
import { Plus, ArrowLeft, Loader2, WifiOff } from 'lucide-react';

const CityPopupsPage = () => {
  const { cityId } = useParams<{ cityId: string }>();
  const [city, setCity] = useState<City | null>(null);
  const [popups, setPopups] = useState<CityPopup[]>([]);
  const [joinedPopupIds, setJoinedPopupIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const { user, profile, showEditProfileModal } = useAuth();

  const fetchPageData = useCallback(async () => {
    if (!cityId) return;

    setLoading(true);
    setError(null);

    try {
      const [cityRes, popupsRes, joinedPopupsRes] = await Promise.all([
        supabase.from('cities').select('*').eq('id', cityId).single(),
        supabase.from('city_popups').select('*, creator:profiles(*), chat_groups(id)').eq('city_id', cityId).order('created_at', { ascending: false }),
        user ? supabase.from('chat_group_members').select('chat_groups!inner(popup_id)').eq('user_id', user.id) : Promise.resolve({ data: [], error: null })
      ]);

      if (cityRes.error) throw cityRes.error;
      setCity(cityRes.data);

      if (popupsRes.error) throw popupsRes.error;
      setPopups(popupsRes.data as CityPopup[]);

      if (joinedPopupsRes.data) {
        const ids = new Set((joinedPopupsRes.data as any[]).map(p => p.chat_groups?.popup_id).filter(Boolean));
        setJoinedPopupIds(ids);
      }

    } catch (err: any) {
      console.error('Could not fetch page data:', err);
      setError(`Could not load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [cityId, user]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const handleCreateClick = () => {
    if (!user) {
      // Redirect to auth or show login modal
      return;
    }
    if (!profile?.full_name || !profile?.ig_link) {
      showEditProfileModal(true);
    } else {
      setCreateModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-24">
      <div className="bg-white p-4 shadow-sm sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center space-x-3">
            <Link to="/stranger" className="p-2 rounded-full hover:bg-gray-100">
                <ArrowLeft className="w-5 h-5 text-gray-800" />
            </Link>
            <h1 className="text-xl font-medium text-gray-900">{city?.name || 'Community Popups'}</h1>
        </div>
        {user && (
            <button
              onClick={handleCreateClick}
              className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg flex items-center transition-colors duration-300 shadow-sm"
            >
              <Plus size={20} className="mr-1" />
              Create
            </button>
        )}
      </div>
      
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center p-16"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
        ) : error ? (
          <div className="text-center py-12 text-red-500"><WifiOff className="w-12 h-12 mx-auto mb-2" />{error}</div>
        ) : popups.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg">No popups have been created for this city yet.</p>
            <p className="mt-1">Be the first to create one!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {popups.map((popup) => (
              <PopupCard 
                key={popup.id} 
                popup={popup} 
                isJoined={joinedPopupIds.has(popup.id)}
                onJoinSuccess={() => {
                  setJoinedPopupIds(prev => new Set(prev).add(popup.id));
                  fetchPageData(); // Re-fetch to update member counts etc.
                }}
              />
            ))}
          </div>
        )}
      </div>

      {isCreateModalOpen && city && (
        <CreatePopupModal
          city={city}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            setCreateModalOpen(false);
            fetchPageData(); // Refresh popups after creation
          }}
        />
      )}
    </div>
  );
};

export default CityPopupsPage;
