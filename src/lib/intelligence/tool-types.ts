/**
 * Types for AI tool outputs
 * Used by both the API tools and frontend components
 */

import { Recommendation } from './types';

// ===========================================
// TOOL OUTPUT STATUS TYPES
// ===========================================

export type ToolStatus = 'loading' | 'success' | 'error';

// ===========================================
// GET RECOMMENDATIONS TOOL OUTPUTS
// ===========================================

export interface RecommendationsLoadingOutput {
  status: 'loading';
  message: string;
}

export interface RecommendationsSuccessOutput {
  status: 'success';
  success: true;
  introMessage: string;
  followUpQuestion: string;
  recommendations: RecommendationCard[];
  context: RecommendationsToolInput;
}

export interface RecommendationsErrorOutput {
  status: 'error';
  success: false;
  error: string;
  recommendations: [];
}

export type RecommendationsToolOutput =
  | RecommendationsLoadingOutput
  | RecommendationsSuccessOutput
  | RecommendationsErrorOutput;

// ===========================================
// RECOMMENDATION CARD (Frontend format)
// ===========================================

export interface RecommendationCard {
  title: string;
  description: string;
  url: string;
  image: string;
  price: {
    amount: string;
    currency: string;
    unit: string;
  } | null;
  location: string;
  duration: string | null;
  categories: string[];
  scoreBreakdown: Recommendation['scoreBreakdown'];
  reasons: string;
}

// ===========================================
// TOOL INPUT TYPES
// ===========================================

export interface RecommendationsToolInput {
  // UI Messages (Required)
  introMessage: string;
  followUpQuestion: string;

  // Priority 1 (Required)
  ciudad: string;
  fecha: string;
  personas: number;

  // Priority 2 (Important)
  tipoGrupo: 'sola' | 'pareja' | 'familia' | 'amigos';
  ocasion?: string;
  categoria?: string;
  presupuesto?: 'bajo' | 'medio' | 'alto' | 'no_prioritario';

  // Priority 3 (Fine-tuning)
  nivelEnergia?: 'slow_cozy' | 'calm_mindful' | 'uplifting' | 'social';
  intencion?: 'invitar' | 'sorprender' | 'compartir' | 'agradecer' | 'celebrar';
  evitar?: string[];

  // Priority 4 (Optional)
  modalidad?: 'indoor' | 'outdoor' | 'stay_in';
}

// ===========================================
// REQUEST FEEDBACK TOOL TYPES
// ===========================================

export interface FeedbackToolInput {
  contextMessage: string;
  recommendationContext?: {
    recommendationIds: string[];
    userSentiment: 'positive' | 'negative';
  };
}

export interface FeedbackToolOutput {
  success: boolean;
  message: string;
  showFeedbackForm: boolean;
  context: FeedbackToolInput['recommendationContext'] | null;
}
