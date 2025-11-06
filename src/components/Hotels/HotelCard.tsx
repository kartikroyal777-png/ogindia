import React from 'react';
import { motion } from 'framer-motion';
import { Star, Wifi, ParkingCircle, Utensils, Heart, Share2 } from 'lucide-react';
import { HotelOffer } from '../../types';

interface HotelCardProps {
  hotel: HotelOffer;
  onView: (offerId: string) => void;
  onSave: (hotelId: string) => void;
}

const amenityIcons: { [key: string]: React.ElementType } = {
  'WIFI': Wifi,
  'PARKING': ParkingCircle,
  'RESTAURANT': Utensils,
};

const HotelCard: React.FC<HotelCardProps> = ({ hotel, onView, onSave }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 border overflow-hidden">
      <div className="relative h-48">
        <img src={hotel.images[0]} alt={hotel.name} className="w-full h-full object-cover" />
        <div className="absolute top-2 right-2 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-bold">
          ₹{hotel.price.amount.toLocaleString()}<span className="font-normal text-xs">/night</span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg text-gray-800 pr-2">{hotel.name}</h3>
          <div className="flex items-center space-x-1 flex-shrink-0">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="font-bold text-sm">{hotel.rating}</span>
          </div>
        </div>
        <p className="text-sm text-gray-500 truncate">{hotel.address}</p>
        <div className="flex items-center space-x-3 mt-3">
          {hotel.amenities.slice(0, 3).map(amenity => {
            const Icon = amenityIcons[amenity] || Wifi;
            return <Icon key={amenity} className="w-5 h-5 text-gray-500" />;
          })}
        </div>
      </div>
      <div className="p-4 border-t flex justify-between items-center">
        <div className="flex space-x-1">
          <motion.button onClick={() => onSave(hotel.hotel_id)} className="p-2 rounded-full hover:bg-red-50 text-gray-500 hover:text-red-500">
            <Heart className="w-5 h-5" />
          </motion.button>
          <motion.button className="p-2 rounded-full hover:bg-blue-50 text-gray-500 hover:text-blue-500">
            <Share2 className="w-5 h-5" />
          </motion.button>
        </div>
        <motion.button onClick={() => onView(hotel.hotel_id)} className="px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          View Offer
        </motion.button>
      </div>
    </div>
  );
};

export default HotelCard;
