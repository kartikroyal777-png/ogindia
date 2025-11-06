import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

type HotelSearchBarProps = {
  onSearch: (params: { city: string; checkin: string; checkout: string; adults: number; }) => void;
};

const HotelSearchBar: React.FC<HotelSearchBarProps> = ({ onSearch }) => {
  const [city, setCity] = useState('UDR');
  const [checkin, setCheckin] = useState(new Date().toISOString().split('T')[0]);
  const [checkout, setCheckout] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [adults, setAdults] = useState(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ city, checkin, checkout, adults });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md border p-4 space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-600">Destination</label>
        <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="Enter IATA City Code (e.g., UDR)" className="w-full mt-1 p-2 border rounded-lg bg-gray-50" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-600">Check-in</label>
          <input type="date" value={checkin} onChange={e => setCheckin(e.target.value)} className="w-full mt-1 p-2 border rounded-lg bg-gray-50" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Check-out</label>
          <input type="date" value={checkout} onChange={e => setCheckout(e.target.value)} className="w-full mt-1 p-2 border rounded-lg bg-gray-50" />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-600">Guests</label>
        <input type="number" value={adults} min={1} onChange={e => setAdults(parseInt(e.target.value))} className="w-full mt-1 p-2 border rounded-lg bg-gray-50" />
      </div>
      <motion.button
        type="submit"
        className="w-full py-3 bg-orange-500 text-white font-semibold rounded-lg shadow-md flex items-center justify-center space-x-2"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Search className="w-5 h-5" />
        <span>Search Hotels</span>
      </motion.button>
    </form>
  );
};

export default HotelSearchBar;
