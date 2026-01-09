import { generateText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import type { UserContext, Experience, Recommendation, ScoringBreakdown } from './types';
import { buildPrompt } from './prompt-builder';
import { generateFallbackRecommendations } from './fallback';

// Zod schema for AI response validation - Updated for priority-based scoring
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
  ).min(3).max(5),
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
    const prompt = buildPrompt(userContext, experiences);

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
 */
function mapAIResponseToRecommendations(
  aiResponse: AIRecommendationResponse,
  experiences: Experience[]
): Recommendation[] {
  return aiResponse.recommendations
    .map(aiRec => {
      const match = aiRec.experienceId.match(/^exp-(\d+)$/);

      if (!match) {
        console.warn(`Invalid experience ID format: ${aiRec.experienceId}`);
        return null;
      }

      const index = parseInt(match[1], 10);
      const experience = experiences[index];

      if (!experience) {
        console.warn(`Experience at index ${index} not found (ID: ${aiRec.experienceId})`);
        return null;
      }

      // Convert priority-based scores to legacy format for frontend compatibility
      const scoreBreakdown: ScoringBreakdown = {
        occasion: aiRec.scoreBreakdown.priority2,  // Priority 2 includes ocasión
        relation: aiRec.scoreBreakdown.priority2,  // Priority 2 includes tipoGrupo
        mood: aiRec.scoreBreakdown.priority3,      // Priority 3 includes nivelEnergia
        budget: aiRec.scoreBreakdown.priority2,    // Priority 2 includes presupuesto
        total: aiRec.scoreBreakdown.total,
      };

      return {
        experience,
        scoreBreakdown,
        reasons: aiRec.reasons,
      };
    })
    .filter((rec): rec is Recommendation => rec !== null);
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
