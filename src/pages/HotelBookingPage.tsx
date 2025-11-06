import React, { useState } from 'react';
import { ArrowLeft, Loader2, WifiOff, Hotel } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HotelOffer } from '../types';
import HotelSearchBar from '../components/Hotels/HotelSearchBar';
import HotelCard from '../components/Hotels/HotelCard';
import { supabase } from '../lib/supabase';

const mapAmadeusToHotelOffer = (offer: any): HotelOffer => {
  const { hotel, offers } = offer;
  const price = offers?.[0]?.price;
  const imageUrl = hotel.media?.[0]?.uri || 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/400x300/orange/white?text=No+Image';

  return {
    hotel_id: hotel.hotelId,
    name: hotel.name,
    address: `${hotel.address?.lines?.[0] || ''}, ${hotel.address?.cityName || ''}`,
    coordinates: { lat: hotel.latitude, lon: hotel.longitude },
    rating: hotel.rating ? parseInt(hotel.rating) : 0,
    images: [imageUrl],
    price: {
      amount: price ? parseFloat(price.total) : 0,
      currency: price?.currency || 'N/A',
      type: 'per_night',
    },
    amenities: hotel.amenities?.map((amenity: string) => amenity.replace(/_/g, ' ').replace(/\b\w/g, (l:string) => l.toUpperCase())) || [],
    provider: 'Amadeus',
    raw: offer,
  };
};

const HotelBookingPage: React.FC = () => {
  const [hotels, setHotels] = useState<HotelOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (params: any) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);
    
    try {
      const { data, error: functionError } = await supabase.functions.invoke('get-hotels', {
        body: { ...params }
      });

      if (functionError || (data && !data.ok)) {
        const errorMessage = functionError?.message || data.details || 'Failed to fetch hotels. The API might be down or your search query is invalid.';
        throw new Error(errorMessage);
      }
      
      const mappedHotels = data.data.data.map(mapAmadeusToHotelOffer);
      setHotels(mappedHotels);

    } catch (err: any) {
      let friendlyError = "Failed to fetch hotels. Please try again later.";
      if (err.message.includes("Failed to fetch") || err.message.includes("is not configured")) {
        friendlyError = "Could not connect to the hotel service. Please ensure you have deployed the 'get-hotels' Supabase function and set the LITE_API_KEY in your Supabase project's environment variables.";
      } else if (err.message.includes("400")) {
        friendlyError = "Invalid search query. The city code might be incorrect. Please try using a valid IATA city code (e.g., 'DEL' for Delhi).";
      } else {
        friendlyError = err.message;
      }
      setError(friendlyError);
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center space-x-4">
        <Link to="/" className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-800" />
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Find Hotels</h1>
      </div>

      <div className="p-4">
        <HotelSearchBar onSearch={handleSearch} />
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex justify-center items-center p-16"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
        ) : error ? (
          <div className="text-center py-12 text-red-500 flex flex-col items-center">
            <WifiOff className="w-12 h-12 mb-4 text-red-400" />
            <h3 className="text-lg font-semibold">Could not fetch hotels</h3>
            <p className="text-sm max-w-sm">{error}</p>
          </div>
        ) : !hasSearched ? (
            <div className="text-center py-12 text-gray-500">
                <Hotel className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold">Ready to find your stay?</h3>
                <p className="text-sm">Use the search bar above to find hotels in your destination.</p>
                <p className="text-xs mt-2">(Hint: The test API works best with IATA city codes like 'UDR' for Udaipur or 'JAI' for Jaipur.)</p>
            </div>
        ) : hotels.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <h3 className="text-lg font-semibold">No hotels found</h3>
            <p className="text-sm">Try adjusting your search criteria or using a different city code.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hotels.map((hotel, index) => (
              <motion.div
                key={hotel.hotel_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <HotelCard hotel={hotel} onView={() => {}} onSave={() => {}} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelBookingPage;
