/**
 * Core types for the Momenta Intelligence Layer
 * Based on Priority Matrix for Recommendations
 */

// ===========================================
// USER CONTEXT - Based on Priority Matrix
// ===========================================

export interface UserContext {
  // PRIORIDAD 1 (CRÍTICA) - Sin esto NO se puede recomendar
  fecha: string;              // Día del momento/plan
  ciudad: string;             // Bogotá o Medellín
  personas: number;           // 1, 2, 3-4, 5+

  // PRIORIDAD 2 (ALTA) - Ajusta significativamente las recomendaciones
  tipoGrupo: TipoGrupo;       // sola, pareja, familia, amigos
  categoria?: Categoria;      // gastronomía, arte, bienestar, etc.
  ocasion?: string;           // cumpleaños, aniversario, reencuentro, etc.
  presupuesto?: Presupuesto;  // bajo, medio, alto (solo como restricción suave)

  // PRIORIDAD 3 (MEDIA) - Filtra y ajusta
  franjaHoraria?: FranjaHoraria;  // mañana, tarde, noche, flexible
  intencion?: Intencion;          // invitar, sorprender, compartir, agradecer
  nivelEnergia?: NivelEnergia;    // slow_cozy, calm_mindful, uplifting, social
  evitar?: string[];              // multitudes, ruido, alcohol, largas_distancias

  // PRIORIDAD 4 (BAJA) - Ajuste fino
  modalidad?: Modalidad;          // indoor, outdoor, stay_in
  moodActual?: MoodActual;        // feliz, tranquila, bajita_energia, romantica
  tipoConexion?: TipoConexion;    // conmigo_misma, pareja, amigos_cercanos
}

// Enums para validación
export type TipoGrupo = 'sola' | 'pareja' | 'familia' | 'amigos';
export type Categoria = 'gastronomia' | 'bienestar' | 'arte_creatividad' | 'aventura' | 'cultural';
export type Presupuesto = 'bajo' | 'medio' | 'alto' | 'no_prioritario';
export type FranjaHoraria = 'manana' | 'tarde' | 'noche' | 'flexible';
export type Intencion = 'invitar' | 'sorprender' | 'compartir' | 'agradecer' | 'celebrar';
export type NivelEnergia = 'slow_cozy' | 'calm_mindful' | 'uplifting' | 'social';
export type Modalidad = 'indoor' | 'outdoor' | 'stay_in';
export type MoodActual = 'feliz' | 'tranquila' | 'bajita_energia' | 'romantica';
export type TipoConexion = 'conmigo_misma' | 'pareja' | 'amigos_cercanos' | 'grupo_amplio';

// Pesos de prioridad para scoring
export const PRIORITY_WEIGHTS = {
  // Prioridad 1: 40% del score total
  ciudad: 0.15,
  fecha: 0.10,
  personas: 0.15,

  // Prioridad 2: 35% del score total
  tipoGrupo: 0.10,
  categoria: 0.10,
  ocasion: 0.10,
  presupuesto: 0.05,

  // Prioridad 3: 20% del score total
  franjaHoraria: 0.05,
  intencion: 0.05,
  nivelEnergia: 0.05,
  evitar: 0.05,

  // Prioridad 4: 5% del score total (ajuste fino)
  modalidad: 0.02,
  moodActual: 0.02,
  tipoConexion: 0.01,
};

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
