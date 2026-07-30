import React from 'react';

const VehicleCardSkeleton = () => (
  <div className="card overflow-hidden">
    <div className="h-48 animate-pulse bg-steel-300/50" />
    <div className="space-y-4 p-5">
      <div className="h-6 w-2/3 animate-pulse bg-steel-300/50" />
      <div className="h-4 w-1/3 animate-pulse bg-steel-300/50" />
      <div className="h-10 animate-pulse bg-steel-300/50" />
    </div>
  </div>
);

export default VehicleCardSkeleton;
