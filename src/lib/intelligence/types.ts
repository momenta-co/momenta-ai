/**
 * Core types for the Momenta Intelligence Layer
 */

// User Context: Input from the user describing their desired experience
export interface UserContext {
  occasion: string; // e.g., "Cita romántica", "Cumpleaños", "Tarde con amigos"
  withWho: string; // e.g., "Pareja", "Amigos", "Solo/a", "Familia"
  mood: string; // e.g., "Relajado", "Aventurero", "Cultural"
  budget: number; // Price range in COP
  city: string; // e.g., "Bogotá", "Medellín"
}

// Experience: An activity/experience from the Momenta catalog
export interface Experience {
  id: string;
  title: string;
  description: string;
  categories: string[]; // e.g., ["Cocina", "Para parejas", "En Bogotá"]
  price: {
    amount: string;
    currency: string;
    unit: string;
  } | null;
  duration: string | null;
  minPeople: number | null;
  location: string;
  url: string;
  image: string;
}

// Scoring Breakdown: How well an experience matches each context dimension
export interface ScoringBreakdown {
  occasion: number; // 0-100
  relation: number; // 0-100 (withWho compatibility)
  mood: number; // 0-100
  budget: number; // 0-100
  total: number; // Average or weighted sum
}

// Recommendation: An experience with AI reasoning
export interface Recommendation {
  experience: Experience;
  scoreBreakdown: ScoringBreakdown;
  reasons: string; // Paragraph (2-4 sentences) explaining "Why Momenta chose this"
}

// API Response Meta
export interface RecommendationMeta {
  model: string;
  promptVersion: string;
  timestamp: string;
}

// Complete API Response
export interface RecommendationResponse {
  recommendations: Recommendation[];
  meta: RecommendationMeta;
}

// API Request Body
export interface RecommendationRequest {
  userContext: UserContext;
  experiencePool: Experience[];
}
