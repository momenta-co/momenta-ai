import { z } from 'zod';

// User Context Schema - Based on Priority Matrix
export const userContextSchema = z.object({
  // PRIORIDAD 1 (Crítica) - Requeridos
  fecha: z.string().min(1, 'Fecha is required'),
  ciudad: z.string().min(1, 'Ciudad is required'),
  personas: z.number().min(1, 'Personas must be at least 1'),

  // PRIORIDAD 2 (Alta)
  tipoGrupo: z.enum(['sola', 'pareja', 'familia', 'amigos']),
  categoria: z.enum(['gastronomia', 'bienestar', 'arte_creatividad', 'aventura', 'cultural']).optional(),
  ocasion: z.string().optional(),
  presupuesto: z.enum(['bajo', 'medio', 'alto', 'no_prioritario']).optional(),

  // PRIORIDAD 3 (Media)
  franjaHoraria: z.enum(['manana', 'tarde', 'noche', 'flexible']).optional(),
  intencion: z.enum(['invitar', 'sorprender', 'compartir', 'agradecer', 'celebrar']).optional(),
  nivelEnergia: z.enum(['slow_cozy', 'calm_mindful', 'uplifting', 'social']).optional(),
  evitar: z.array(z.string()).optional(),

  // PRIORIDAD 4 (Baja)
  modalidad: z.enum(['indoor', 'outdoor', 'stay_in']).optional(),
  moodActual: z.enum(['feliz', 'tranquila', 'bajita_energia', 'romantica']).optional(),
  tipoConexion: z.enum(['conmigo_misma', 'pareja', 'amigos_cercanos', 'grupo_amplio']).optional(),
});

// Experience Schema
export const experienceSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  categories: z.array(z.string()),
  price: z.object({
    amount: z.string(),
    currency: z.string(),
    unit: z.string(),
  }).nullable(),
  duration: z.string().nullable(),
  minPeople: z.number().nullable(),
  location: z.string(),
  url: z.string().url(),
  image: z.string().url(),
});

// Scoring Breakdown Schema
export const scoringBreakdownSchema = z.object({
  occasion: z.number().min(0).max(100),
  relation: z.number().min(0).max(100),
  mood: z.number().min(0).max(100),
  budget: z.number().min(0).max(100),
  total: z.number().min(0).max(100),
});

// Recommendation Schema
export const recommendationSchema = z.object({
  experience: experienceSchema,
  scoreBreakdown: scoringBreakdownSchema,
  reasons: z.string().min(10, 'Reasons must be a paragraph (2-4 sentences)'),
});

// API Request Schema
export const recommendationRequestSchema = z.object({
  userContext: userContextSchema,
});

// API Response Meta Schema
export const recommendationMetaSchema = z.object({
  model: z.string(),
  promptVersion: z.string(),
  timestamp: z.string(),
});

// API Response Schema
export const recommendationResponseSchema = z.object({
  recommendations: z.array(recommendationSchema).min(1).max(5),
  meta: recommendationMetaSchema,
});

// Type inference from schemas
export type UserContextInput = z.infer<typeof userContextSchema>;
export type ExperienceInput = z.infer<typeof experienceSchema>;
export type RecommendationRequestInput = z.infer<typeof recommendationRequestSchema>;
