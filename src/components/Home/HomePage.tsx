import React, { useState, useEffect, useCallback } from 'react';
    import { motion, AnimatePresence } from 'framer-motion';
    import { useNavigate } from 'react-router-dom';
    import SearchBar from './SearchBar';
    import CategoryBar from './CategoryBar';
    import CityCard from './CityCard';
    import { City, Category } from '../../types';
    import { supabase } from '../../lib/supabase';
    import { Bot, Loader2, WifiOff } from 'lucide-react';
    import AssistantModal from '../Assistant/AssistantModal';
    import CityCardSkeleton from '../Layout/CityCardSkeleton';
    import Orb from './Orb';

    const CITIES_PER_PAGE = 9;

    const FramedImage: React.FC<{ src: string, alt: string, className: string, delay: number }> = ({ src, alt, className, delay }) => (
      <motion.div
        className={`absolute bg-white p-1.5 shadow-xl rounded-lg ${className}`}
        initial={{ opacity: 0, y: 50, scale: 0.8 }}
        animate={{ opacity: 1, y: ["-5px", "5px"], scale: 1 }}
        transition={{ 
          opacity: { duration: 0.8, ease: "easeOut", delay },
          y: { duration: 3 + Math.random() * 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay },
          scale: { duration: 0.8, ease: "easeOut", delay }
        }}
      >
        <img src={src} alt={alt} className="w-full h-full object-cover rounded" />
      </motion.div>
    );

    const HomePage: React.FC = () => {
      const navigate = useNavigate();
      const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
      const [searchQuery, setSearchQuery] = useState('');
      const [allCities, setAllCities] = useState<City[]>([]);
      const [allCategories, setAllCategories] = useState<Category[]>([]);
      const [filteredCities, setFilteredCities] = useState<City[]>([]);
      const [displayedCities, setDisplayedCities] = useState<City[]>([]);
      const [page, setPage] = useState(0);
      const [hasMore, setHasMore] = useState(true);
      const [loading, setLoading] = useState(true);
      const [loadingMore, setLoadingMore] = useState(false);
      const [error, setError] = useState<string | null>(null);
      const [isAssistantOpen, setIsAssistantOpen] = useState(false);

      useEffect(() => {
        const fetchInitialData = async () => {
          setLoading(true);
          setError(null);
          
          const [citiesResult, categoriesResult] = await Promise.allSettled([
            supabase.from('cities').select('*, city_categories(category_id)'),
            supabase.from('categories').select('*').order('name')
          ]);

          let errors: string[] = [];

          if (citiesResult.status === 'fulfilled' && !citiesResult.value.error) {
            setAllCities(citiesResult.value.data || []);
          } else {
            const cityError = citiesResult.status === 'rejected' ? citiesResult.reason : (citiesResult.value as any).error;
            console.error("City fetch error:", cityError);
            errors.push(`Could not fetch cities: ${cityError?.message || 'Unknown error'}`);
          }

          if (categoriesResult.status === 'fulfilled' && !categoriesResult.value.error) {
            setAllCategories(categoriesResult.value.data || []);
          } else {
            const categoryError = categoriesResult.status === 'rejected' ? categoriesResult.reason : (categoriesResult.value as any).error;
            console.error("Category fetch error:", categoryError);
            errors.push(`Could not fetch categories: ${categoryError?.message || 'Unknown error'}`);
          }

          if (errors.length > 0) {
            setError(errors.join(' '));
          }

          setLoading(false);
        };
        fetchInitialData();
      }, []);
      
      const handleCitySelect = (city: City) => {
        navigate(`/city/${city.id}`);
      };

      const applyFiltersAndSort = useCallback(() => {
        let filtered = [...allCities];
        if (selectedCategory) {
          filtered = filtered.filter(city => 
            city.city_categories?.some(cc => cc.category_id === selectedCategory)
          );
        }
        if (searchQuery) {
          const lowerCaseQuery = searchQuery.toLowerCase();
          filtered = filtered.filter(city =>
            city.name?.toLowerCase().includes(lowerCaseQuery) ||
            city.state?.toLowerCase().includes(lowerCaseQuery)
          );
        }
        
        if (!searchQuery && !selectedCategory) {
          filtered.sort((a, b) => (b.popularity_score || 0) - (a.popularity_score || 0));
        }

        setFilteredCities(filtered);
        setDisplayedCities(filtered.slice(0, CITIES_PER_PAGE));
        setPage(1);
        setHasMore(filtered.length > CITIES_PER_PAGE);
      }, [searchQuery, selectedCategory, allCities]);

      useEffect(() => {
        const debounce = setTimeout(() => {
            applyFiltersAndSort();
        }, 300);
        return () => clearTimeout(debounce);
      }, [searchQuery, selectedCategory, allCities, applyFiltersAndSort]);

      const loadMoreCities = () => {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
        const nextPage = page + 1;
        const newCities = filteredCities.slice(0, nextPage * CITIES_PER_PAGE);
        setDisplayedCities(newCities);
        setPage(nextPage);
        setHasMore(newCities.length < filteredCities.length);
        setLoadingMore(false);
      };

      return (
        <>
          <div className="relative bg-orange-50 px-4 pt-16 pb-20 text-center overflow-hidden h-[70vh] md:h-[60vh] flex flex-col justify-center">
            <div className="absolute inset-0 z-0 opacity-30">
              <Orb hoverIntensity={0.3} rotateOnHover={true} hue={-15} />
            </div>

            <FramedImage src="https://images.unsplash.com/photo-1564507592333-c60657eea523?w=200&h=250&fit=crop" alt="Taj Mahal" className="w-20 h-28 md:w-32 md:h-40 top-10 left-4 md:left-16 transform -rotate-12" delay={0.2} />
            <FramedImage src="https://images.unsplash.com/photo-1599661046289-e31897846364?w=200&h=250&fit=crop" alt="Hawa Mahal" className="w-16 h-24 md:w-28 md:h-36 top-12 right-4 md:right-16 transform rotate-6" delay={0.4}/>
            <FramedImage src="https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=200&h=250&fit=crop" alt="Goa Beach" className="hidden sm:block w-24 h-32 bottom-16 left-24 transform rotate-8" delay={0.6}/>
            <FramedImage src="https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=200&h=250&fit=crop" alt="Varanasi Ghats" className="hidden sm:block w-28 h-36 bottom-12 right-20 transform -rotate-3" delay={0.8}/>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative z-10 max-w-xl mx-auto"
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium text-gray-900 mb-2 text-center drop-shadow-sm">
                Discover <span className="text-orange-500">Incredible India</span>
              </h1>
              <p className="text-sm sm:text-base text-gray-600 text-center mb-6">
                Your trusted guide for exploring India safely and authentically
              </p>
              <SearchBar onSearch={setSearchQuery} />
            </motion.div>
          </div>

          <CategoryBar
            categories={allCategories}
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
          />

          <div className="px-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                {searchQuery || selectedCategory ? `Results (${filteredCities.length})` : 'Popular Destinations'}
              </h2>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, index) => <CityCardSkeleton key={index} />)}
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500 flex flex-col items-center">
                <WifiOff className="w-12 h-12 mb-4 text-red-400" />
                <h3 className="text-lg font-semibold">Could not load data</h3>
                <p className="text-sm max-w-sm">{error}</p>
              </div>
            ) : displayedCities.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔍</span>
                </div>
                <h3 className="text-lg text-gray-900 mb-2">No destinations found</h3>
                <p className="text-gray-500">Try adjusting your search or changing the category.</p>
              </motion.div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedCities.map((city, index) => (
                    <CityCard
                      key={city.id}
                      city={city}
                      onClick={handleCitySelect}
                      index={index}
                    />
                  ))}
                </div>
                {hasMore && (
                  <div className="mt-8 text-center">
                    <motion.button
                      onClick={loadMoreCities}
                      disabled={loadingMore}
                      className="px-6 py-2 bg-orange-500 text-white rounded-full shadow-md disabled:opacity-50 flex items-center justify-center mx-auto"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {loadingMore ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Load More'}
                    </motion.button>
                  </div>
                )}
              </>
            )}
          </div>

          <motion.button
            onClick={() => setIsAssistantOpen(true)}
            className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full shadow-lg flex items-center justify-center z-40"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Open AI Assistant"
          >
            <Bot className="w-7 h-7" />
          </motion.button>
          
          <AnimatePresence>
            {isAssistantOpen && <AssistantModal onClose={() => setIsAssistantOpen(false)} />}
          </AnimatePresence>
        </>
      );
    };

    export default HomePage;
