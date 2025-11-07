import React from 'react';
import { motion } from 'framer-motion';
import { Star, Wifi, ParkingCircle, Utensils, Heart, Share2, MapPin } from 'lucide-react';
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
    <motion.div 
      className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 border overflow-hidden flex flex-col h-full"
      whileHover={{ y: -5 }}
    >
      <div className="relative h-48 overflow-hidden">
        <img src={hotel.images[0]} alt={hotel.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
          <Star className="w-4 h-4 text-yellow-500 fill-current" />
          <span>{hotel.rating}</span>
        </div>
      </div>
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="font-medium text-lg text-gray-800 pr-2 leading-tight">{hotel.name}</h3>
        <p className="text-sm text-gray-500 flex items-center space-x-1 mt-1">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{hotel.address}</span>
        </p>
        <div className="flex items-center space-x-4 mt-4 text-gray-500">
          {hotel.amenities.slice(0, 3).map(amenity => {
            const Icon = amenityIcons[amenity] || Wifi;
            return <Icon key={amenity} className="w-5 h-5" title={amenity} />;
          })}
        </div>
        <div className="flex-grow"></div>
        <div className="mt-4 flex justify-between items-end">
           <div>
              <p className="text-gray-500 text-xs">Starts from</p>
              <p className="text-xl font-semibold text-gray-900">
                ₹{hotel.price.amount.toLocaleString()}
                <span className="text-sm font-normal text-gray-600">/night</span>
              </p>
           </div>
           <motion.button onClick={() => onView(hotel.hotel_id)} className="px-5 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg shadow-md hover:bg-orange-600" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            View
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default HotelCard;
