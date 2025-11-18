import { CityCard } from './CityCard';
import { SearchBar } from './SearchBar';
import { Orb } from './Orb';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useEffect, useState } from 'react';
import { City } from '../../types';
import CityCardSkeleton from '../Layout/CityCardSkeleton';

export const HomePage = () => {
  const { session } = useAuth();
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCities = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching cities:', error);
      } else {
        setCities(data);
      }
      setLoading(false);
    };

    fetchCities();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="relative h-[80vh] sm:h-[70vh] min-h-[500px] max-h-[700px] w-full">
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2670')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20"></div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-4 animate-fade-in-down">
            Explore, Connect, Wander
          </h1>
          <p className="text-base sm:text-lg max-w-2xl mb-8 animate-fade-in-up">
            Discover new cities, meet fellow travelers, and create unforgettable memories. Your next adventure starts here.
          </p>
          <div className="w-full max-w-2xl">
            <SearchBar />
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Popular Destinations</h2>
          {session ? (
            <Link to="/stranger" className="text-orange-600 hover:text-orange-700 font-semibold transition-colors whitespace-nowrap">
              Find Strangers &rarr;
            </Link>
          ) : (
             <Link to="/auth" className="text-orange-600 hover:text-orange-700 font-semibold transition-colors whitespace-nowrap">
              Login to see more &rarr;
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {loading ? (
            Array.from({ length: 8 }).map((_, index) => <CityCardSkeleton key={index} />)
          ) : (
            cities.map((city) => (
              <CityCard key={city.id} city={city} />
            ))
          )}
        </div>
      </main>

      <Orb />
    </div>
  );
};
