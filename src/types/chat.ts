import type { Experience } from '@/types/experience';

export interface AudioVisualizerData {
  volume: number;
  frequencies: number[];
}

export interface RecommendationData {
  title: string;
  description: string;
  url: string;
  image: string;
  price: Experience['price'];
  location: string;
  duration: string | null;
  categories: string[];
  scoreBreakdown: {
    occasion: number;
    relation: number;
    mood: number;
    budget: number;
    total: number;
  };
  reasons: string;
}

export interface CarouselExperience {
  title: string;
  description: string;
  image: string;
}
