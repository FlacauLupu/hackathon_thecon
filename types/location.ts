export type Coordinates = {
  lat: number;
  long: number;
};

export type Location = {
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  imageUrl: string;
  shortDescription: string;
  rating: number;
};

