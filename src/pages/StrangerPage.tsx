import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Search, Users, Loader2, WifiOff, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { City } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import StrangerCityCard from '../components/Community/StrangerCityCard';

const StrangerPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cities, setCities] = useState<City[]>([]);
  const [joinedCityIds, setJoinedCityIds] = useState<Set<string>>(new Set());
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const [citiesRes, joinedRes, countsRes] = await Promise.all([
        supabase.from('cities').select('*').order('name'),
        user ? supabase.from('user_joined_cities').select('city_id').eq('user_id', user.id) : Promise.resolve({ data: [] }),
        supabase.rpc('get_city_member_counts')
      ]);

      if (citiesRes.error) {
        setError(citiesRes.error.message);
      } else {
        setCities(citiesRes.data || []);
      }

      if (joinedRes.data) {
        setJoinedCityIds(new Set(joinedRes.data.map(j => j.city_id)));
      }

      if (countsRes.data) {
        const countsMap = (countsRes.data as any[]).reduce((acc, item) => {
          acc[item.city_id] = item.member_count;
          return acc;
        }, {} as Record<string, number>);
        setMemberCounts(countsMap);
      }
      
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const handleJoinCity = async (cityId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    const { error } = await supabase.from('user_joined_cities').insert({ user_id: user.id, city_id: cityId });
    if (!error) {
      setJoinedCityIds(prev => new Set(prev).add(cityId));
      setMemberCounts(prev => ({ ...prev, [cityId]: (prev[cityId] || 0) + 1 }));
    } else {
      console.error("Failed to join city:", error.message);
    }
  };

  const filteredCities = useMemo(() => {
    return cities.filter(city => city.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [cities, searchQuery]);

  const { joinedCities, otherCities } = useMemo(() => {
    const joined: City[] = [];
    const others: City[] = [];
    filteredCities.forEach(city => {
      if (joinedCityIds.has(city.id)) {
        joined.push(city);
      } else {
        others.push(city);
      }
    });
    return { joinedCities: joined, otherCities: others };
  }, [filteredCities, joinedCityIds]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="relative bg-gradient-to-br from-orange-50 to-orange-100 p-4 pt-6 pb-8 border-b">
         <div className="absolute top-4 left-4 z-10">
            <Link to="/" className="p-2 rounded-full bg-white/50 hover:bg-white transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-800" />
            </Link>
         </div>
         <div className="text-center mt-8">
            <Users className="w-12 h-12 text-orange-500 mx-auto mb-3" />
            <h1 className="text-2xl font-medium text-gray-900 mb-2">Travel With Strangers</h1>
            <p className="text-gray-600 max-w-md mx-auto">Join city-specific groups to find travel buddies, plan meetups, and share experiences.</p>
         </div>
      </div>

      <div className="p-4 sticky top-[0] bg-gray-50/80 backdrop-blur-sm z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search for a city to join..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border rounded-xl shadow-sm"
          />
        </div>
      </div>

      <div className="p-4 space-y-6">
        {loading ? (
          <div className="flex justify-center p-16"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
        ) : error ? (
          <div className="text-center py-12 text-red-500"><WifiOff className="w-12 h-12 mx-auto mb-2" />{error}</div>
        ) : (
          <>
            {joinedCities.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-gray-600 mb-3 uppercase tracking-wider">My Cities</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {joinedCities.map(city => <StrangerCityCard key={city.id} city={city} memberCount={memberCounts[city.id] || 0} isJoined={true} onJoin={handleJoinCity} />)}
                </div>
              </div>
            )}
            <div>
              <h2 className="text-sm font-medium text-gray-600 mb-3 uppercase tracking-wider">{joinedCities.length > 0 ? 'Explore Other Cities' : 'All Cities'}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {otherCities.length > 0 ? (
                  otherCities.map(city => <StrangerCityCard key={city.id} city={city} memberCount={memberCounts[city.id] || 0} isJoined={false} onJoin={handleJoinCity} />)
                ) : (
                  <p className="text-center text-gray-500 py-8 col-span-full">No cities match your search.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StrangerPage;
