import React from 'react';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';

const FullScreenLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 border-4 border-gray-200 border-t-orange-500 rounded-full mb-6 relative flex items-center justify-center"
      >
        <Crown className="w-6 h-6 text-orange-500 absolute" />
      </motion.div>
      <h1 className="text-xl font-medium text-gray-800">
        Go <span className="text-orange-500">India</span>
      </h1>
      <p className="text-gray-600">Loading your experience...</p>
    </div>
  );
};

export default FullScreenLoader;
