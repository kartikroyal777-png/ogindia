import React from 'react';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const ShopPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 bg-gray-50">
       <Link to="/" className="absolute top-4 left-4 p-2 rounded-full bg-white/50 hover:bg-white transition-colors z-20">
          <ArrowLeft className="w-5 h-5 text-gray-800" />
        </Link>
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 20 }}
        className="max-w-md"
      >
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border">
            <ShoppingBag className="w-12 h-12 text-gray-400" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-800">Travel Necessities</h1>
        <p className="text-gray-500 mt-2">Coming Soon!</p>
        <p className="text-gray-500 mt-4">
          We're curating a collection of the best, locally-sourced travel essentials to make your trip to India even better. Stay tuned!
        </p>
      </motion.div>
    </div>
  );
};

export default ShopPage;
