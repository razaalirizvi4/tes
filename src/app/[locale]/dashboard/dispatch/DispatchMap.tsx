'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Driver, Order } from '@/types';

interface DispatchMapProps {
  drivers: Driver[];
  pendingOrders: Order[];
  selectedOrder: Order | null;
  onOrderSelect: (order: Order | null) => void;
}

interface MarkerInfo {
  marker: google.maps.Marker;
  type: 'driver' | 'order';
  id: string;
}

export default function DispatchMap({ 
  drivers, 
  pendingOrders, 
  selectedOrder,
  onOrderSelect 
}: DispatchMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<MarkerInfo[]>([]);

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '',
        version: 'weekly',
        libraries: ['geometry'],
      });

      try {
        const google = await loader.load();
        if (mapRef.current) {
          // Center map on the first driver or order
          const center = drivers[0]
            ? { lat: drivers[0].currentLat || 0, lng: drivers[0].currentLng || 0 }
            : pendingOrders[0]
            ? { lat: pendingOrders[0].pickupLat || 0, lng: pendingOrders[0].pickupLng || 0 }
            : { lat: 0, lng: 0 };

          const mapInstance = new google.maps.Map(mapRef.current, {
            center,
            zoom: 13,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }],
              },
            ],
          });

          setMap(mapInstance);
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error);
      }
    };

    if (!map) {
      initMap();
    }
  }, [map, drivers, pendingOrders]);

  // Update markers when drivers or orders change
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(({ marker }) => marker.setMap(null));
    markersRef.current = [];

    // Add driver markers
    drivers.forEach(driver => {
      if (driver.currentLat && driver.currentLng) {
        const marker = new google.maps.Marker({
          position: { lat: driver.currentLat, lng: driver.currentLng },
          map,
          title: driver.user.name || 'Driver',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: driver.status === 'BUSY' ? '#FFA000' : '#4CAF50',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          },
        });

        markersRef.current.push({
          marker,
          type: 'driver',
          id: driver.id,
        });
      }
    });

    // Add order markers
    pendingOrders.forEach(order => {
      if (order.pickupLat && order.pickupLng) {
        const marker = new google.maps.Marker({
          position: { lat: order.pickupLat, lng: order.pickupLng },
          map,
          title: `Order #${order.id.slice(-6)}`,
          icon: {
            url: '/marker-order.png', // You'll need to create this icon
            scaledSize: new google.maps.Size(32, 32),
          },
        });

        marker.addListener('click', () => {
          onOrderSelect(order);
        });

        markersRef.current.push({
          marker,
          type: 'order',
          id: order.id,
        });

        // If this is the selected order, show route to nearest driver
        if (selectedOrder?.id === order.id) {
          const nearestDriver = findNearestDriver(
            { lat: order.pickupLat, lng: order.pickupLng },
            drivers
          );

          if (nearestDriver) {
            drawRoute(
              { lat: nearestDriver.currentLat!, lng: nearestDriver.currentLng! },
              { lat: order.pickupLat, lng: order.pickupLng },
              map
            );
          }
        }
      }
    });
  }, [map, drivers, pendingOrders, selectedOrder, onOrderSelect]);

  return <div ref={mapRef} className="w-full h-full" />;
}

function findNearestDriver(
  orderLocation: google.maps.LatLngLiteral,
  drivers: Driver[]
): Driver | null {
  const availableDrivers = drivers.filter(
    d => d.status === 'ONLINE' && d.currentLat && d.currentLng
  );

  if (availableDrivers.length === 0) return null;

  return availableDrivers.reduce((nearest, current) => {
    const nearestDist = google.maps.geometry.spherical.computeDistanceBetween(
      new google.maps.LatLng(nearest.currentLat!, nearest.currentLng!),
      new google.maps.LatLng(orderLocation.lat, orderLocation.lng)
    );

    const currentDist = google.maps.geometry.spherical.computeDistanceBetween(
      new google.maps.LatLng(current.currentLat!, current.currentLng!),
      new google.maps.LatLng(orderLocation.lat, orderLocation.lng)
    );

    return currentDist < nearestDist ? current : nearest;
  }, availableDrivers[0]);
}

async function drawRoute(
  origin: google.maps.LatLngLiteral,
  destination: google.maps.LatLngLiteral,
  map: google.maps.Map
) {
  const directionsService = new google.maps.DirectionsService();
  const directionsRenderer = new google.maps.DirectionsRenderer({
    map,
    suppressMarkers: true,
    polylineOptions: {
      strokeColor: '#4CAF50',
      strokeWeight: 4,
    },
  });

  try {
    const result = await directionsService.route({
      origin,
      destination,
      travelMode: google.maps.TravelMode.DRIVING,
    });

    directionsRenderer.setDirections(result);
  } catch (error) {
    console.error('Error calculating route:', error);
  }
}