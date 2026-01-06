import { generateText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import type { UserContext, Experience, Recommendation } from './types';
import { buildPrompt } from './prompt-builder';
import { generateFallbackRecommendations } from './fallback';

// Zod schema for AI response validation
const aiRecommendationSchema = z.object({
  recommendations: z.array(
    z.object({
      experienceId: z.string(),
      scoreBreakdown: z.object({
        occasion: z.number().min(0).max(100),
        relation: z.number().min(0).max(100),
        mood: z.number().min(0).max(100),
        budget: z.number().min(0).max(100),
        total: z.number().min(0).max(100),
      }),
      reasons: z.string().min(10), // Paragraph format (2-4 sentences)
    })
  ).min(3).max(5),
});

type AIRecommendationResponse = z.infer<typeof aiRecommendationSchema>;

/**
 * Generate recommendations using OpenAI
 */
export async function generateAIRecommendations(
  userContext: UserContext,
  experiences: Experience[]
): Promise<Recommendation[]> {
  // Validate environment variables
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    console.warn('OPENAI_API_KEY not set, using fallback');
    return generateFallbackRecommendations(userContext, experiences);
  }

  try {
    // Build the prompt
    const prompt = buildPrompt(userContext, experiences);

    // Call OpenAI using AI SDK with structured output
    // Note: Type casting needed due to AI SDK version compatibility
    const result = await generateText({
      model: openai(model) as any,
      system: prompt.system,
      prompt: prompt.user,
      temperature: prompt.config.temperature,
      output: Output.object({
        schema: aiRecommendationSchema,
      }),
    } as any);

    // Extract structured output
    const aiResponse = (result as any).output as AIRecommendationResponse;
    console.log('AI Response: ', aiResponse);

    // Map AI response to our Recommendation format
    const recommendations = mapAIResponseToRecommendations(
      aiResponse,
      experiences
    );

    return recommendations;
  } catch (error) {
    console.error('OpenAI API error, falling back to heuristic scoring:', error);

    // Fallback to heuristic scoring on error
    return generateFallbackRecommendations(userContext, experiences);
  }
}

/**
 * Map AI response to our Recommendation type
 * Handles index-based IDs (exp-0, exp-1, etc.) returned by the AI
 */
function mapAIResponseToRecommendations(
  aiResponse: AIRecommendationResponse,
  experiences: Experience[]
): Recommendation[] {
  return aiResponse.recommendations
    .map(aiRec => {
      // Parse index from experienceId (format: "exp-0", "exp-1", etc.)
      const match = aiRec.experienceId.match(/^exp-(\d+)$/);

      if (!match) {
        console.warn(`Invalid experience ID format: ${aiRec.experienceId}`);
        return null;
      }

      const index = parseInt(match[1], 10);
      const experience = experiences[index];

      if (!experience) {
        console.warn(`Experience at index ${index} not found in pool (ID: ${aiRec.experienceId})`);
        return null;
      }

      return {
        experience,
        scoreBreakdown: aiRec.scoreBreakdown,
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
