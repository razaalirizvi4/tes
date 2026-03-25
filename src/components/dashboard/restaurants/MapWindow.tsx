import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { useTranslations } from 'next-intl';

interface MapWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (lat: number, lng: number, address: string) => void;
  initialAddress?: string;
}

const MapWindow: React.FC<MapWindowProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  initialAddress,
}) => {
  const tCommon = useTranslations('common');
  const tLocation = useTranslations('location');
  const [markerPosition, setMarkerPosition] = useState({ lat: 24.8607, lng: 67.0011 }); // Default to Karachi
  const [address, setAddress] = useState(initialAddress || '');
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);

  useEffect(() => {
    if (window.google) {
      setGeocoder(new google.maps.Geocoder());
    }
  }, []);

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      updateAddress(lat, lng);
    }
  };

  const updateAddress = async (lat: number, lng: number) => {
    if (!geocoder) return;

    try {
      const results = await geocoder.geocode({
        location: { lat, lng },
      });

      if (results.results?.[0]) {
        setAddress(results.results[0].formatted_address);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  const handleAddressSearch = async () => {
    if (!geocoder) return;

    try {
      const results = await geocoder.geocode({ address });

      if (results.results?.[0]?.geometry?.location) {
        const location = results.results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        setMarkerPosition({ lat, lng });
        map?.panTo({ lat, lng });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  const handleConfirm = () => {
    onSelectLocation(markerPosition.lat, markerPosition.lng, address);
    onClose();
  };

  const onMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      updateAddress(lat, lng);
    }
  };

  const onLoad = (map: google.maps.Map) => {
    setMap(map);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl">
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddressSearch();
                }
              }}
              placeholder={tLocation("enterAddress")}
              className="flex-1 p-2 border rounded-md"
            />
            <button
              onClick={handleAddressSearch}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              {tCommon("search")}
            </button>
          </div>
          <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '400px', borderRadius: '0.375rem' }}
              center={markerPosition}
              zoom={15}
              onClick={handleMapClick}
              onLoad={onLoad}
              options={{
                zoomControl: true,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: true,
              }}
            >
              <Marker
                position={markerPosition}
                draggable={true}
                onDragEnd={onMarkerDragEnd}
              />
            </GoogleMap>
          </LoadScript>
        </div>
        <div className="p-4 bg-gray-50 rounded-b-lg flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
          >
            {tCommon("cancel")}
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            {tCommon("confirmLocation")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapWindow;