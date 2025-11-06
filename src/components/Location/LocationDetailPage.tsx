import React, { useState, useEffect, useCallback } from 'react';
    import { useParams, useNavigate } from 'react-router-dom';
    import { motion, AnimatePresence } from 'framer-motion';
    import { 
      ArrowLeft, Info, Car, Shield, Globe, DollarSign, ChevronLeft, ChevronRight, MapPin, 
      Wallet, Star, Building, Clock, Sun, Camera, Users, Heart, CheckCircle, Calendar, Cloud, Wind,
      Banknote, HandCoins, Building2, Youtube, Activity as ActivityIcon, WifiOff, Utensils, Package
    } from 'lucide-react';
    import { Location, Day, City, LocationImage } from '../../types';
    import { supabase } from '../../lib/supabase';
    import axios from 'axios';
    import { useAuth } from '../../contexts/AuthContext';
    import LocationDetailSkeleton from '../Layout/LocationDetailSkeleton';

    type LocationWithDetails = Location & {
      day: Day & { city: City; };
      images: LocationImage[];
    };

    const OPEN_WEATHER_API_KEY = import.meta.env.VITE_OPENWEATHERMAP_API_KEY;
    const AQI_API_KEY = import.meta.env.VITE_AQI_API_KEY;

    const LocationDetailPage: React.FC = () => {
      const { locationId } = useParams<{ locationId: string }>();
      const navigate = useNavigate();
      const { user } = useAuth();
      const [location, setLocation] = useState<LocationWithDetails | null>(null);
      const [weather, setWeather] = useState<any>(null);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState<string | null>(null);
      const [currentImageIndex, setCurrentImageIndex] = useState(0);
      const [isSaved, setIsSaved] = useState(false);
      const [isSaving, setIsSaving] = useState(false);

      const fetchLocationData = useCallback(async () => {
        if (!locationId) return;
        setLoading(true);
        setError(null);
        try {
          const { data, error: dbError } = await supabase.from('locations').select('*, day:days(*, city:cities(*)), images:location_images(*)').eq('id', locationId).single();
          if (dbError || !data) throw dbError || new Error('Location not found');
          setLocation(data as unknown as LocationWithDetails);

          if (data.latitude && data.longitude && OPEN_WEATHER_API_KEY && OPEN_WEATHER_API_KEY !== 'YOUR_API_KEY' && AQI_API_KEY && AQI_API_KEY !== 'YOUR_API_KEY') {
            try {
              const weatherResponse = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${data.latitude}&lon=${data.longitude}&appid=${OPEN_WEATHER_API_KEY}&units=metric`);
              const aqiResponse = await axios.get(`https://api.waqi.info/feed/geo:${data.latitude};${data.longitude}/?token=${AQI_API_KEY}`);
              setWeather({ ...weatherResponse.data, aqi: aqiResponse.data.data.aqi });
            } catch (weatherError) { console.error("Could not fetch weather data:", weatherError); setWeather(null); }
          } else { setWeather(null); }

        } catch (err: any) { setError(err.message || 'Could not find the requested location.'); console.error(err); } 
        finally { setLoading(false); }
      }, [locationId]);

      const checkIsSaved = useCallback(async () => {
        if (!user || !locationId) return;
        const { data, error } = await supabase.from('saved_places').select('location_id').eq('user_id', user.id).eq('location_id', locationId).single();
        setIsSaved(!error && !!data);
      }, [user, locationId]);
      
      useEffect(() => { fetchLocationData(); }, [fetchLocationData]);
      useEffect(() => { if(location) { checkIsSaved(); } }, [location, checkIsSaved]);

      const handleToggleSave = async () => {
        if (!user) { navigate('/auth'); return; }
        if (isSaving) return;
        setIsSaving(true);
        if (isSaved) {
          const { error } = await supabase.from('saved_places').delete().match({ user_id: user.id, location_id: locationId });
          if (!error) setIsSaved(false);
        } else {
          const { error } = await supabase.from('saved_places').insert({ user_id: user.id, location_id: locationId });
          if (!error) setIsSaved(true);
        }
        setIsSaving(false);
      };

      const images = location?.images && location.images.length > 0 ? location.images.map(i => i.image_url) : location?.image_url ? [location.image_url] : [];
      const nextImage = () => setCurrentImageIndex(p => (p + 1) % images.length);
      const prevImage = () => setCurrentImageIndex(p => (p - 1 + images.length) % images.length);

      if (loading) return <LocationDetailSkeleton />;
      if (error || !location) return <div className="p-4 text-center text-red-500 flex flex-col items-center justify-center h-screen"><WifiOff className="w-12 h-12 mb-4 text-red-400" /><h3 className="text-lg font-semibold">Could not load location data</h3><p className="text-sm max-w-sm">{error || 'The requested location could not be found.'}</p><button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg">Go Back</button></div>;
      
      const d = location.details || {};
      const getAqiInfo = (aqi: number) => {
        if (aqi <= 50) return { text: "Good", color: "text-green-500", bg: "bg-green-100" };
        if (aqi <= 100) return { text: "Moderate", color: "text-yellow-500", bg: "bg-yellow-100" };
        if (aqi <= 150) return { text: "Unhealthy (SG)", color: "text-orange-500", bg: "bg-orange-100" };
        return { text: "Unhealthy", color: "text-red-500", bg: "bg-red-100" };
      };

      const DetailCard: React.FC<{icon: React.ElementType, title: string, children: React.ReactNode, className?: string}> = ({icon: Icon, title, children, className}) => (<motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5 }} className={`bg-white rounded-2xl shadow-sm border p-5 ${className}`}><h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-3 text-lg"><div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center"><Icon className="w-5 h-5 text-orange-500" /></div><span>{title}</span></h3><div className="space-y-3">{children}</div></motion.div>);
      const InfoItem: React.FC<{icon?: React.ElementType, label: string, value?: string | React.ReactNode | null}> = ({icon: Icon, label, value}) => (value ? <div className="flex justify-between items-center text-sm border-b border-gray-100 py-2.5 last:border-b-0"><p className="text-gray-500 flex items-center space-x-2">{Icon && <Icon className="w-4 h-4 text-gray-400" />}<span>{label}</span></p><p className="text-gray-800 font-normal text-right">{value}</p></div> : null);
      const SectionWithCarousel: React.FC<{title: string, icon: React.ElementType, items?: any[], renderItem: (item: any) => React.ReactNode}> = ({title, icon: Icon, items, renderItem}) => (items && items.length > 0 ? <DetailCard icon={Icon} title={title}><div className="flex space-x-4 overflow-x-auto scrollbar-hide -m-2 p-2">{items.map((item, i) => <div key={i} className="flex-shrink-0 w-60">{renderItem(item)}</div>)}</div></DetailCard> : null);
      const PhotoSpotCard: React.FC<{item: any}> = ({item}) => (<a href={item.map_link || '#'} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden shadow-md bg-white h-full hover:shadow-xl transition-shadow"><img src={item.image_url} className="w-full h-32 object-cover" /><div className="p-3"><p className="font-medium text-sm truncate">{item.title}</p><p className="text-xs text-gray-600 line-clamp-2">{item.description}</p></div></a>);
      const RecommendationCard: React.FC<{item: any}> = ({item}) => (<a href={item.map_link || '#'} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden shadow-md bg-white h-full hover:shadow-xl transition-shadow"><img src={item.image_url} className="w-full h-32 object-cover" /><div className="p-3"><p className="font-medium text-sm truncate">{item.name}</p></div></a>);
      const VideoCard: React.FC<{item: any}> = ({item}) => (<a href={`https://www.youtube.com/watch?v=${item.video_id}`} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden shadow-md bg-white h-full hover:shadow-xl transition-shadow"><div className="relative"><img src={`https://i.ytimg.com/vi/${item.video_id}/hqdefault.jpg`} className="w-full h-32 object-cover" /><div className="absolute inset-0 flex items-center justify-center bg-black/30"><Youtube className="w-10 h-10 text-white" /></div></div><div className="p-3"><p className="font-medium text-sm truncate">{item.title}</p><p className="text-xs text-gray-600">by {item.influencer_name}</p></div></a>);
      
      const ThingsToDoItem: React.FC<{item: any}> = ({item}) => (
        <div className="flex items-start space-x-4">
            {item?.image_url && <img src={item.image_url} alt={item.title} className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />}
            <div>
                <p className="font-semibold text-gray-800">{item?.title}</p>
                <p className="text-sm text-gray-600">{item?.description}</p>
            </div>
        </div>
      );

      return (
        <div className="bg-gray-100 min-h-screen">
          <div className="relative h-80 group">
            <AnimatePresence initial={false}><motion.img key={currentImageIndex} src={images[currentImageIndex] || 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/800x600.png'} alt={location.name} className="absolute w-full h-full object-cover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} /></AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            {images.length > 1 && (<><button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft /></button><button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight /></button></>)}
            <div className="absolute top-4 left-4 right-4 flex justify-between z-10">
                <motion.button onClick={() => navigate(-1)} className="bg-white/80 backdrop-blur-sm p-2 rounded-full" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} ><ArrowLeft className="w-5 h-5 text-gray-800" /></motion.button>
                <motion.button onClick={handleToggleSave} className="bg-white/80 backdrop-blur-sm p-2 rounded-full" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} >
                    <Heart className={`w-5 h-5 transition-all ${isSaved ? 'text-red-500 fill-current' : 'text-gray-800'}`} />
                </motion.button>
            </div>
            <div className="absolute bottom-4 left-4 text-white z-10"><p className="text-md bg-black/40 px-2 py-1 rounded-md inline-block">{location.category}</p><h1 className="text-4xl font-bold mt-1">{location.name}</h1><p className="text-lg text-gray-200">{location.day?.city?.name}</p></div>
          </div>

          <div className="p-4 space-y-6 -mt-8 relative z-10">
            <DetailCard icon={Info} title="About This Location"><p className="text-sm text-gray-700 leading-relaxed">{d.about?.historical_background || 'No description available.'}</p></DetailCard>
            {weather ? (<DetailCard icon={Cloud} title="Live Weather & AQI"><div className="flex justify-around items-center text-center"><div className="w-1/3"><p className="text-3xl font-semibold">{Math.round(weather.main.temp)}°C</p><p className="text-xs capitalize">{weather.weather[0].description}</p></div><div className="w-1/3 border-x"><Wind className="w-6 h-6 mx-auto text-gray-500" /><p className="text-sm">{weather.wind.speed} m/s</p></div><div className="w-1/3"><p className={`text-3xl font-semibold ${getAqiInfo(weather.aqi).color}`}>{weather.aqi}</p><p className={`text-xs px-2 py-0.5 rounded-full inline-block ${getAqiInfo(weather.aqi).bg}`}>AQI: {getAqiInfo(weather.aqi).text}</p></div></div></DetailCard>) : <div className="bg-white rounded-2xl p-4 text-center text-sm text-gray-500">Weather data unavailable.</div>}
            
            {(d.booking_info?.package_booking_link || d.booking_info?.vehicle_rental_link) && (
              <DetailCard icon={Package} title="Booking & Rentals">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {d.booking_info.package_booking_link && <a href={d.booking_info.package_booking_link} target="_blank" rel="noopener noreferrer" className="block w-full py-3 border-2 border-orange-500/50 text-orange-600 font-medium rounded-xl text-center hover:bg-orange-50 hover:border-orange-500 transition-all shadow-sm">Book a Package</a>}
                  {d.booking_info.vehicle_rental_link && <a href={d.booking_info.vehicle_rental_link} target="_blank" rel="noopener noreferrer" className="block w-full py-3 border-2 border-blue-500/50 text-blue-600 font-medium rounded-xl text-center hover:bg-blue-50 hover:border-blue-500 transition-all shadow-sm">Rent a Vehicle</a>}
                </div>
              </DetailCard>
            )}

            <DetailCard icon={Clock} title="Timings & Best Time"><InfoItem icon={Sun} label="Best Season" value={d.best_time_to_visit?.best_season} /><InfoItem icon={Clock} label="Best Time of Day" value={d.best_time_to_visit?.best_time_of_day} /><InfoItem icon={Calendar} label="Weekly Closures" value={d.opening_hours?.weekly_closures?.join(', ') || 'Open all week'} /></DetailCard>
            <DetailCard icon={Car} title="Getting Here"><InfoItem icon={MapPin} label="Nearest Airport" value={d.transport?.nearest_airport} /><InfoItem icon={MapPin} label="Nearest Railway" value={d.transport?.nearest_railway_station} /><InfoItem icon={Car} label="Last-Mile Options" value={d.transport?.last_mile_options} /><InfoItem icon={Banknote} label="Taxi Estimate" value={d.transport?.taxi_cost_estimate} /></DetailCard>
            <DetailCard icon={DollarSign} title="Costs & Money"><InfoItem icon={Wallet} label="Foreigner Ticket" value={d.costs_money?.ticket_prices?.foreigner} /><InfoItem icon={Wallet} label="Local Ticket" value={d.costs_money?.ticket_prices?.local} /><InfoItem icon={HandCoins} label="Avg. Budget/Day" value={d.costs_money?.avg_budget_per_day} /><InfoItem icon={CheckCircle} label="Digital Payments" value={d.costs_money?.digital_payment_availability} /></DetailCard>
            <DetailCard icon={Shield} title="Safety & Scams"><InfoItem icon={Shield} label="Safety Score" value={`${d.safety_risks?.safety_score || 'N/A'}/10`} /><InfoItem icon={Heart} label="Women's Safety" value={d.safety_risks?.womens_safety_rating} />{d.safety_risks?.scams_warnings && d.safety_risks.scams_warnings.length > 0 && <div className="mt-2"><p className="text-sm font-medium text-gray-600">Common Scams:</p><ul className="list-disc list-inside text-sm text-gray-700 space-y-1 pl-4">{d.safety_risks.scams_warnings.map((scam, i) => <li key={i}>{scam}</li>)}</ul></div>}</DetailCard>
            <DetailCard icon={Globe} title="Cultural Etiquette"><InfoItem icon={Users} label="Dress Code" value={d.cultural_etiquette?.dress_code} /><InfoItem icon={Camera} label="Photography Rules" value={d.cultural_etiquette?.photography_rules} />{d.cultural_etiquette?.dos_donts && d.cultural_etiquette.dos_donts.length > 0 && <div className="mt-2"><p className="text-sm font-medium text-gray-600">Do's & Don'ts:</p><ul className="list-disc list-inside text-sm text-gray-700 space-y-1 pl-4">{d.cultural_etiquette.dos_donts.map((tip, i) => <li key={i}>{tip}</li>)}</ul></div>}</DetailCard>
            
            {d.things_to_do?.main_activities && d.things_to_do.main_activities.length > 0 && (
              <DetailCard icon={ActivityIcon} title="Things To Do">
                <div className="space-y-4">
                  {d.things_to_do.main_activities.map((act, i) => <ThingsToDoItem key={i} item={act} />)}
                </div>
              </DetailCard>
            )}

            <SectionWithCarousel title="Best Photo Spots" icon={Camera} items={d.photo_spots} renderItem={(item) => <PhotoSpotCard item={item} />} />
            <SectionWithCarousel title="Nearby Restaurants" icon={Utensils} items={d.recommended_restaurants} renderItem={(item) => <RecommendationCard item={item} />} />
            <SectionWithCarousel title="Recommended Hotels" icon={Building2} items={d.recommended_hotels} renderItem={(item) => <RecommendationCard item={item} />} />
            <SectionWithCarousel title="Influencer Videos" icon={Youtube} items={d.influencer_videos} renderItem={(item) => <VideoCard item={item} />} />
          </div>
        </div>
      );
    };

    export default LocationDetailPage;
