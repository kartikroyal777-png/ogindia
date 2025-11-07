import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, Shield, Thermometer, Sun, Moon, Sunset, Loader2, WifiOff } from 'lucide-react';
import { City, Day, Location } from '../types';
import { supabase } from '../lib/supabase';
import LocationCard from '../components/Tehsil/LocationCard';
import FullScreenLoader from '../components/Layout/FullScreenLoader';

const CityItineraryPage: React.FC = () => {
  const { cityId } = useParams<{ cityId: string }>();
  const navigate = useNavigate();
  const [city, setCity] = useState<City | null>(null);
  const [days, setDays] = useState<Day[]>([]);
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!cityId) {
        setError('No City ID provided.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);

      try {
        const { data: cityData, error: cityError } = await supabase
          .from('cities')
          .select('*')
          .eq('id', cityId)
          .single();
        
        if (cityError || !cityData) throw new Error('City not found');
        setCity(cityData);

        const { data: daysData, error: daysError } = await supabase
          .from('days')
          .select('*')
          .eq('city_id', cityId)
          .order('day_number');

        if (daysError) throw new Error('Could not fetch itinerary');
        setDays(daysData || []);
        if (daysData && daysData.length > 0) {
          setActiveDay(daysData[0].id);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [cityId]);

  useEffect(() => {
    const fetchLocations = async () => {
      if (!activeDay) {
        setLocations([]);
        return;
      }
      setLoadingLocations(true);
      const { data, error: locError } = await supabase
        .from('locations')
        .select('*, images:location_images(*)')
        .eq('day_id', activeDay)
        .order('timing_tag');
      
      if (locError) {
        setError('Could not fetch locations for this day.');
        setLocations([]);
      } else {
        setLocations((data as Location[]) ?? []);
      }
      setLoadingLocations(false);
    };
    fetchLocations();
  }, [activeDay]);

  const getTimingIcon = (timing: string | null) => {
    switch (timing) {
      case 'Morning': return <Sun className="w-4 h-4 text-amber-500" />;
      case 'Afternoon': return <Sun className="w-4 h-4 text-orange-500" />;
      case 'Evening': return <Moon className="w-4 h-4 text-indigo-500" />;
      default: return <Sunset className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return <FullScreenLoader />;
  }

  if (error || !city) {
    return (
      <div className="p-4 text-center text-red-500 flex flex-col items-center justify-center h-screen">
        <WifiOff className="w-12 h-12 mb-4 text-red-400" />
        <h3 className="text-lg font-semibold">Could not load city data</h3>
        <p className="text-sm max-w-sm">{error || 'The requested city could not be found.'}</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg">Go Back</button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      <div className="relative h-64">
        <img src={city.thumbnail_url || 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/800x600.png'} alt={city.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <motion.button onClick={() => navigate('/')} className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm p-2 rounded-full z-10" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <ArrowLeft className="w-5 h-5 text-gray-800" />
        </motion.button>
        <div className="absolute bottom-4 left-4 text-white z-10">
          <h1 className="text-3xl font-medium">{city.name}</h1>
          <p className="text-lg">{city.short_tagline}</p>
        </div>
      </div>

      <div className="p-4">
        <p className="text-gray-600 mb-4">{city.description}</p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-white p-3 rounded-lg shadow-sm"><MapPin className="w-5 h-5 text-orange-500 mx-auto mb-1" /><p className="text-sm">{city.state || 'N/A'}</p></div>
          <div className="bg-white p-3 rounded-lg shadow-sm"><Shield className="w-5 h-5 text-green-500 mx-auto mb-1" /><p className="text-sm">{city.safety_score || 'N/A'}/10 Safety</p></div>
          <div className="bg-white p-3 rounded-lg shadow-sm"><Thermometer className="w-5 h-5 text-blue-500 mx-auto mb-1" /><p className="text-sm">{city.best_time_to_visit || 'N/A'}</p></div>
        </div>
      </div>

      <div className="sticky top-16 bg-gray-50/80 backdrop-blur-sm z-10 p-4 border-b">
        <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
          {days.length > 0 ? days.map(day => (
            <motion.button key={day.id} onClick={() => setActiveDay(day.id)} className={`relative px-4 py-2 rounded-full font-medium text-sm flex-shrink-0 transition-all ${activeDay === day.id ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-white text-gray-700 hover:bg-gray-100 border'}`}>
              Day {day.day_number}
            </motion.button>
          )) : <p className="text-sm text-gray-500">No itinerary available for this city yet.</p>}
        </div>
      </div>

      <div className="p-4">
        <AnimatePresence mode="wait">
          <motion.div key={activeDay} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <h2 className="text-xl font-medium text-gray-900 mb-4">{days.find(d => d.id === activeDay)?.title || 'Select a day'}</h2>
            {loadingLocations ? (
                <div className="flex justify-center items-center p-8"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
            ) : locations.length > 0 ? (
              <div className="space-y-4">
                {locations.map((location, index) => (
                  <motion.div key={location.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                    <div className="flex items-center space-x-3 mb-2">
                      {getTimingIcon(location.timing_tag)}
                      <span className="text-sm font-semibold text-gray-600">{location.timing_tag}</span>
                    </div>
                    <LocationCard location={location} onClick={() => navigate(`/location/${location.id}`)} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No locations planned for this day.</p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CityItineraryPage;
