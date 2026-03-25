'use client';

import { useState } from 'react';
import LocationSelector from './LocationSelector';

export default function LocationSelectorWrapper() {
  const [locationSelected, setLocationSelected] = useState(false);

  const handleLocationSelected = () => {
    setLocationSelected(true);
    // Here you can add logic to store the selected location or redirect
  };

  if (locationSelected) {
    return null;
  }

  return (
    <div className="fixed inset-0  bg-white z-50">
      <LocationSelector onLocationSelected={handleLocationSelected} setIsLocationModalOpen={setLocationSelected}/>
    </div>
  );
}