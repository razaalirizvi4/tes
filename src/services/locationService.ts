import axios from 'axios';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface Location {
  city: string;
  area: string;
  coordinates: Coordinates;
}

class LocationService {
  private readonly GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  async getCurrentLocation(): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  async getAddressFromCoordinates(coordinates: Coordinates): Promise<Location> {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinates.latitude},${coordinates.longitude}&key=${this.GOOGLE_API_KEY}`
      );

      if (response.data.status !== 'OK') {
        throw new Error('Failed to get address from coordinates');
      }

      const addressComponents = response.data.results[0].address_components;
      let city = '';
      let area = '';

      for (const component of addressComponents) {
        if (component.types.includes('locality')) {
          city = component.long_name;
        } else if (component.types.includes('sublocality_level_1')) {
          area = component.long_name;
        }
      }

      return {
        city,
        area,
        coordinates,
      };
    } catch (error) {
      console.error('Error getting address:', error);
      throw error;
    }
  }

  // async getCitiesAndAreas(): Promise<{ [city: string]: string[] }> {
  //   // This would typically come from your backend API
  //   // For now, returning mock data
  //   return {
  //     'New York': ['Manhattan', 'Brooklyn', 'Queens'],
  //     'Los Angeles': ['Downtown', 'Hollywood', 'Santa Monica'],
  //     'Chicago': ['Loop', 'River North', 'Wicker Park'],
  //   };
  // }


// This method fetches the cities and areas from the API


}

export const locationService = new LocationService();
