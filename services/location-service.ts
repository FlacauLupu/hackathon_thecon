import rawLocations from '@/locatii.json';
import { Location } from '@/types/location';
import { slugify } from '@/utils/string';

type RawLocation = {
  name: string;
  address: string;
  coordinates: {
    lat: number;
    long: number;
  };
  image_url: string;
  short_description: string;
  rating: number;
};

let cachedLocations: Location[] | null = null;

const normalizeLocation = (location: RawLocation, index: number): Location => ({
  id: `${slugify(location.name)}-${index}`,
  name: location.name,
  address: location.address,
  coordinates: location.coordinates,
  imageUrl: location.image_url,
  shortDescription: location.short_description,
  rating: location.rating,
});

export const fetchLocations = async (): Promise<Location[]> => {
  if (cachedLocations) {
    return cachedLocations;
  }

  await new Promise((resolve) => setTimeout(resolve, 400)); // mimics network latency

  cachedLocations = (rawLocations as RawLocation[]).map(normalizeLocation);

  return cachedLocations;
};

