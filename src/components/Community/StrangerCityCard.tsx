import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { City } from '../../types';
import { Users, Check } from 'lucide-react';

interface StrangerCityCardProps {
  city: City;
  memberCount: number;
  isJoined: boolean;
  onJoin: (cityId: string) => void;
}

const StrangerCityCard: React.FC<StrangerCityCardProps> = ({ city, memberCount, isJoined, onJoin }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col"
    >
      <div className="relative h-32">
        <img src={city.thumbnail_url} alt={city.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-3 left-4">
            <h3 className="font-medium text-lg text-white">{city.name}</h3>
        </div>
      </div>
      <div className="p-4 flex-grow flex flex-col">
        <p className="text-sm text-gray-500 flex items-center space-x-1 mb-4">
          <Users className="w-4 h-4" />
          <span>{memberCount} members</span>
        </p>
        <div className="flex-grow"></div>
        <div className="flex items-center space-x-2">
          <Link to={`/stranger/${city.id}`} className="flex-1">
            <button className="w-full px-4 py-2 bg-gray-100 text-sm font-medium rounded-lg hover:bg-gray-200">View Popups</button>
          </Link>
          <motion.button 
            onClick={() => onJoin(city.id)} 
            disabled={isJoined}
            className={`px-4 py-2 text-white text-sm font-medium rounded-lg flex items-center justify-center space-x-1.5 ${isJoined ? 'bg-green-500 cursor-default' : 'bg-orange-500 hover:bg-orange-600'}`}
            whileTap={{ scale: isJoined ? 1 : 0.95 }}
          >
            {isJoined ? <Check className="w-4 h-4" /> : null}
            <span>{isJoined ? 'Joined' : 'Join'}</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default StrangerCityCard;
