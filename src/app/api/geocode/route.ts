import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const area = searchParams.get('area');
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const address = searchParams.get('address');

    // Reverse geocoding: coordinates to address
    if (lat && lon) {
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&format=json&addressdetails=1`;
      
      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'FoodApp/1.0', // Nominatim requires a User-Agent header
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.statusText}`);
      }

      const data = await response.json();
      return NextResponse.json(data);
    }

    // Forward geocoding: address/query to coordinates
    if (address) {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
      
      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'FoodApp/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data || data.length === 0) {
        return NextResponse.json(
          { error: 'No results found for the given address' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      });
    }

    // Forward geocoding: city and area to coordinates
    if (city && area) {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(area)},${encodeURIComponent(city)}&format=json&addressdetails=1`;
      
      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'FoodApp/1.0', // Nominatim requires a User-Agent header
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        return NextResponse.json(
          { error: 'No results found for the given city and area' },
          { status: 404 }
        );
      }

      const location = data[0];
      return NextResponse.json({
        lat: parseFloat(location.lat),
        lon: parseFloat(location.lon),
      });
    }

    return NextResponse.json(
      { error: 'Invalid parameters. Provide either (city, area), (lat, lon), or (address)' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching coordinates:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch coordinates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

