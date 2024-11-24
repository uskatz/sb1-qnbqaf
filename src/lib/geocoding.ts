interface GeocodingResult {
  lat: string;
  lon: string;
  display_name: string;
}

export async function searchAddress(query: string): Promise<GeocodingResult> {
  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
  const data = await response.json();
  if (data.length === 0) throw new Error('Address not found');
  return data[0];
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
  const data = await response.json();
  return data.display_name;
}