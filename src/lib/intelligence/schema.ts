import { z } from 'zod';

// User Context Schema
export const userContextSchema = z.object({
  occasion: z.string().min(1, 'Occasion is required'),
  withWho: z.string().min(1, 'withWho is required'),
  mood: z.string().min(1, 'Mood is required'),
  budget: z.number().positive('Budget must be positive'),
  city: z.string().min(1, 'City is required'),
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
