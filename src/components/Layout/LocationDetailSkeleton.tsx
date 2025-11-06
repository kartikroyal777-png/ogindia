import React from 'react';

    const SkeletonCard: React.FC = () => (
        <div className="bg-white rounded-2xl shadow-sm border p-5">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
        </div>
    );

    const LocationDetailSkeleton: React.FC = () => {
      return (
        <div className="bg-gray-100 min-h-screen animate-pulse">
          <div className="relative h-80 bg-gray-300"></div>
          <div className="p-4 space-y-6 -mt-8 relative z-10">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      );
    };

    export default LocationDetailSkeleton;
