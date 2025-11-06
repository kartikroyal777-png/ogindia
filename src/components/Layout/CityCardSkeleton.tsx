import React from 'react';

    const CityCardSkeleton: React.FC = () => (
      <div className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
        <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div className="h-3 bg-gray-200 rounded w-full mb-4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="flex justify-between items-center">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );

    export default CityCardSkeleton;
