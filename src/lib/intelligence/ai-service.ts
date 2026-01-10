import { generateText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import type { UserContext, Experience, Recommendation, ScoringBreakdown } from './types';
import { buildPrompt } from './prompt-builder';
import { generateFallbackRecommendations } from './fallback';

// ============================================
// HARD EXCLUSIONS - Experiencias a EXCLUIR según nivel de energía
// Esto es un FILTRO OBLIGATORIO, no una sugerencia al AI
// ============================================
const ENERGY_HARD_EXCLUSIONS: Record<string, string[]> = {
  slow_cozy: ['aventura', 'parapente', 'escalada', 'rafting', 'kayak', 'adrenalina', 'extremo'],
  calm_mindful: ['aventura', 'parapente', 'escalada', 'extremo', 'fiesta', 'rumba'],
  // uplifting y social no tienen exclusiones duras
};

// ============================================
// USER EXCLUSION KEYWORDS - Mapeo de términos de exclusión
// Cuando el usuario dice "no yoga" o "no spa", estos son los keywords a buscar
// ============================================
const USER_EXCLUSION_KEYWORDS: Record<string, string[]> = {
  yoga: ['yoga', 'hot yoga', 'yogabogota'],
  spa: ['spa', 'masaje', 'relajante', 'aromaterapia', 'reiki', 'reflexología'],
  masaje: ['masaje', 'masajes', 'relajante'],
  aventura: ['aventura', 'parapente', 'escalada', 'rafting', 'kayak', 'adrenalina', 'extremo'],
  cocina: ['cocina', 'taller de cocina', 'chef', 'gastronomía', 'sushi', 'pasta'],
  ceramica: ['cerámica', 'ceramica', 'kintsugi', 'alfarería'],
  vino: ['vino', 'cata', 'enología', 'sommelier'],
  alcohol: ['vino', 'cata', 'cocteles', 'cocktail', 'cerveza', 'whisky', 'gin'],
  bienestar: ['bienestar', 'wellness', 'spa', 'yoga', 'masaje', 'meditación', 'pilates'],
};

/**
 * Pre-filter experiences based on energy level HARD EXCLUSIONS
 * This removes experiences that should NEVER be recommended for certain energy levels
 * @exported for use in route.ts fast path
 */
export function preFilterByEnergy(experiences: Experience[], nivelEnergia?: string): Experience[] {
  if (!nivelEnergia || !ENERGY_HARD_EXCLUSIONS[nivelEnergia]) {
    return experiences;
  }

  const exclusions = ENERGY_HARD_EXCLUSIONS[nivelEnergia];

  return experiences.filter(exp => {
    const combined = (
      exp.title.toLowerCase() + ' ' +
      exp.description.toLowerCase() + ' ' +
      exp.categories.join(' ').toLowerCase()
    );

    // Exclude if ANY exclusion keyword is found
    const shouldExclude = exclusions.some(keyword => combined.includes(keyword));

    if (shouldExclude) {
      console.log(`[PRE-FILTER] Excluded "${exp.title}" for ${nivelEnergia} (matched exclusion keywords)`);
    }

    return !shouldExclude;
  });
}

/**
 * Pre-filter experiences based on USER EXPLICIT EXCLUSIONS
 * When user says "NO yoga" or "sin spa", this filters those experiences out
 * @exported for use in route.ts fast path
 */
export function preFilterByUserExclusions(experiences: Experience[], evitar?: string[]): Experience[] {
  if (!evitar || evitar.length === 0) {
    return experiences;
  }

  // Build list of all keywords to exclude
  const allExclusionKeywords: string[] = [];

  for (const exclusion of evitar) {
    const normalizedExclusion = exclusion.toLowerCase().trim();

    // Check if we have a predefined mapping
    if (USER_EXCLUSION_KEYWORDS[normalizedExclusion]) {
      allExclusionKeywords.push(...USER_EXCLUSION_KEYWORDS[normalizedExclusion]);
    } else {
      // Use the raw exclusion term if no mapping exists
      allExclusionKeywords.push(normalizedExclusion);
    }
  }

  console.log(`[USER-EXCLUSION] Filtering with keywords: ${allExclusionKeywords.join(', ')}`);

  return experiences.filter(exp => {
    const combined = (
      exp.title.toLowerCase() + ' ' +
      exp.description.toLowerCase() + ' ' +
      exp.categories.join(' ').toLowerCase()
    );

    // Exclude if ANY exclusion keyword is found
    const shouldExclude = allExclusionKeywords.some(keyword => combined.includes(keyword));

    if (shouldExclude) {
      console.log(`[USER-EXCLUSION] Excluded "${exp.title}" (matched user exclusion: ${evitar.join(', ')})`);
    }

    return !shouldExclude;
  });
}

// Zod schema for AI response validation - Updated for priority-based scoring
// Requires exactly 5 unique recommendations
const aiRecommendationSchema = z.object({
  recommendations: z.array(
    z.object({
      experienceId: z.string(),
      scoreBreakdown: z.object({
        priority1: z.number().min(0).max(100), // Ciudad, personas, fecha
        priority2: z.number().min(0).max(100), // Tipo grupo, ocasión, categoría, presupuesto
        priority3: z.number().min(0).max(100), // Energía, intención, evitar
        priority4: z.number().min(0).max(100), // Modalidad, mood, conexión
        total: z.number().min(0).max(100),     // Weighted average
      }),
      reasons: z.string().min(10),
    })
  ).min(5).max(5), // Exactamente 5 recomendaciones
});

type AIRecommendationResponse = z.infer<typeof aiRecommendationSchema>;

/**
 * Generate recommendations using OpenAI with priority-based scoring
 */
export async function generateAIRecommendations(
  userContext: UserContext,
  experiences: Experience[]
): Promise<Recommendation[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    console.warn('OPENAI_API_KEY not set, using fallback');
    return generateFallbackRecommendations(userContext, experiences);
  }

  try {
    // PRE-FILTER 1: Remove experiences that contradict energy level
    let filteredExperiences = preFilterByEnergy(experiences, userContext.nivelEnergia);
    console.log(`[AI Service] Energy pre-filter: ${experiences.length} → ${filteredExperiences.length} experiences`);

    // PRE-FILTER 2: Remove experiences the user explicitly wants to avoid
    if (userContext.evitar && userContext.evitar.length > 0) {
      const beforeUserFilter = filteredExperiences.length;
      filteredExperiences = preFilterByUserExclusions(filteredExperiences, userContext.evitar);
      console.log(`[AI Service] User exclusion pre-filter: ${beforeUserFilter} → ${filteredExperiences.length} experiences`);
    }

    if (filteredExperiences.length === 0) {
      console.warn('[AI Service] No experiences after pre-filters, using original list');
      // Fall back to original list if filtering removes everything
    }

    const experiencesToUse = filteredExperiences.length > 0 ? filteredExperiences : experiences;
    const prompt = buildPrompt(userContext, experiencesToUse);

    const result = await generateText({
      model: openai(model) as any,
      system: prompt.system,
      prompt: prompt.user,
      temperature: prompt.config.temperature,
      output: Output.object({
        schema: aiRecommendationSchema,
      }),
    } as any);

    const aiResponse = (result as any).output as AIRecommendationResponse;
    console.log('AI Response: ', aiResponse);

    const recommendations = mapAIResponseToRecommendations(
      aiResponse,
      experiences
    );

    return recommendations;
  } catch (error) {
    console.error('OpenAI API error, falling back to heuristic scoring:', error);
    return generateFallbackRecommendations(userContext, experiences);
  }
}

/**
 * Map AI response to Recommendation format
 * Converts priority-based scores to legacy format for frontend compatibility
 * Filters out duplicates and ensures exactly 5 unique recommendations
 */
function mapAIResponseToRecommendations(
  aiResponse: AIRecommendationResponse,
  experiences: Experience[]
): Recommendation[] {
  const seenIds = new Set<string>();
  const recommendations: Recommendation[] = [];

  // First pass: get unique recommendations from AI response
  for (const aiRec of aiResponse.recommendations) {
    const match = aiRec.experienceId.match(/^exp-(\d+)$/);

    if (!match) {
      console.warn(`Invalid experience ID format: ${aiRec.experienceId}`);
      continue;
    }

    const index = parseInt(match[1], 10);
    const experience = experiences[index];

    if (!experience) {
      console.warn(`Experience at index ${index} not found (ID: ${aiRec.experienceId})`);
      continue;
    }

    // Filter out duplicates - only keep the first occurrence
    if (seenIds.has(experience.id)) {
      console.warn(`Duplicate experience filtered: ${experience.id} (${experience.title})`);
      continue;
    }
    seenIds.add(experience.id);

    // Convert priority-based scores to legacy format for frontend compatibility
    const scoreBreakdown: ScoringBreakdown = {
      occasion: aiRec.scoreBreakdown.priority2,
      relation: aiRec.scoreBreakdown.priority2,
      mood: aiRec.scoreBreakdown.priority3,
      budget: aiRec.scoreBreakdown.priority2,
      total: aiRec.scoreBreakdown.total,
    };

    recommendations.push({
      experience,
      scoreBreakdown,
      reasons: aiRec.reasons,
    });

    // Stop if we have 5
    if (recommendations.length >= 5) break;
  }

  // If we have less than 5, fill with other experiences not yet included
  if (recommendations.length < 5) {
    console.log(`[AI Service] Only ${recommendations.length} unique recommendations, filling to 5`);

    for (let i = 0; i < experiences.length && recommendations.length < 5; i++) {
      const exp = experiences[i];
      if (!seenIds.has(exp.id)) {
        seenIds.add(exp.id);
        recommendations.push({
          experience: exp,
          scoreBreakdown: {
            occasion: 60,
            relation: 60,
            mood: 60,
            budget: 60,
            total: 60,
          },
          reasons: `Esta experiencia también puede ser una gran opción para ti. ¡Échale un vistazo!`,
        });
      }
    }
  }

  console.log(`[AI Service] Returning ${recommendations.length} recommendations`);
  return recommendations;
}

/**
 * Get the model name being used
 */
export function getModelName(): string {
  if (!process.env.OPENAI_API_KEY) {
    return 'fallback-v1';
  }
  return process.env.OPENAI_MODEL || 'gpt-4o-mini';
}
