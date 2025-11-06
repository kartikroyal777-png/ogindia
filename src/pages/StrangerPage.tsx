import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Search, Users, Loader2, WifiOff, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { City } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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

  const CityItem: React.FC<{ city: City; isJoined: boolean }> = ({ city, isJoined }) => (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between"
    >
      <div>
        <h3 className="font-semibold text-lg text-gray-800">{city.name}</h3>
        <p className="text-sm text-gray-500 flex items-center space-x-1">
          <Users className="w-3 h-3" />
          <span>{memberCounts[city.id] || 0} members</span>
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <Link to={`/stranger/${city.id}`}>
          <button className="px-4 py-2 bg-gray-100 text-sm font-medium rounded-lg hover:bg-gray-200">View</button>
        </Link>
        {!isJoined && (
          <button onClick={() => handleJoinCity(city.id)} className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600">Join</button>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center space-x-4">
        <Link to="/" className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-800" />
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Travel With Stranger</h1>
      </div>

      <div className="p-4 sticky top-[72px] bg-gray-50/80 backdrop-blur-sm z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search for a city..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border rounded-xl"
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
                <h2 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wider">My Cities</h2>
                <div className="space-y-3">
                  {joinedCities.map(city => <CityItem key={city.id} city={city} isJoined={true} />)}
                </div>
              </div>
            )}
            <div>
              <h2 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wider">All Cities</h2>
              <div className="space-y-3">
                {otherCities.length > 0 ? (
                  otherCities.map(city => <CityItem key={city.id} city={city} isJoined={false} />)
                ) : (
                  <p className="text-center text-gray-500 py-8">No cities match your search.</p>
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
