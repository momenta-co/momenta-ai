import type { UserContext, Experience } from './types';

export interface PromptConfig {
  temperature: number;
  maxTokens?: number;
}

export const DEFAULT_PROMPT_CONFIG: PromptConfig = {
  temperature: 0.3, // Low temperature for deterministic results
  maxTokens: 2000,
};

/**
 * Builds the system prompt that defines Momenta's decision engine personality
 */
export function buildSystemPrompt(): string {
  return `You are Momenta's decision engine - an AI designed to recommend memorable experiences based on human criteria.

Your role is to:
1. Analyze user context (occasion, who they're with, mood, budget, city)
2. Evaluate available experiences from the Momenta catalog
3. Score each experience on how well it matches the user's context
4. Return the top 3-5 experiences with clear reasoning

SCORING RULES:
- Occasion Match (0-100): How well does the experience fit the occasion?
- Relation Match (0-100): Is it suitable for who they're with (solo, couple, friends, family)?
- Mood Match (0-100): Does it align with their desired mood?
- Budget Match (0-100): Is it within their budget? (Perfect match = 100, over budget = 0-30, under budget = 60-90)
- Total Score: Average of all dimensions

OUTPUT REQUIREMENTS:
- Return top 3-5 recommendations sorted by total score
- Provide 2-4 specific reasons per recommendation explaining "Why Momenta chose this"
- Reasons should be personal, specific, and relate to their context
- Format as valid JSON matching the schema

Be authentic, insightful, and help users discover experiences they'll remember.`;
}

/**
 * Builds the user prompt with context and available experiences
 */
export function buildUserPrompt(
  userContext: UserContext,
  experiences: Experience[]
): string {
  const contextDescription = `
USER CONTEXT:
- Occasion: ${userContext.occasion}
- With: ${userContext.withWho}
- Mood: ${userContext.mood}
- Budget: ${userContext.budget.toLocaleString('es-CO')} COP
- City: ${userContext.city}
`;

  const experiencesDescription = `
AVAILABLE EXPERIENCES:
${experiences.map((exp, idx) => `
${idx + 1}. ${exp.title}
   - ID: ${exp.id} (IMPORTANT: Use this exact ID in your response)
   - Categories: ${exp.categories.join(', ')}
   - Price: ${exp.price ? `${parseInt(exp.price.amount).toLocaleString('es-CO')} ${exp.price.currency}` : 'Price not available'}
   - Duration: ${exp.duration || 'Not specified'}
   - Min People: ${exp.minPeople || 'Flexible'}
   - Location: ${exp.location}
   - Description: ${exp.description.substring(0, 200)}...
`).join('\n')}
`;

  const outputSchema = `
OUTPUT FORMAT (JSON):
{
  "recommendations": [
    {
      "experienceId": "string (use the exact experience ID)",
      "scoreBreakdown": {
        "occasion": number (0-100),
        "relation": number (0-100),
        "mood": number (0-100),
        "budget": number (0-100),
        "total": number (average of above)
      },
      "reasons": [
        "Specific reason 1 relating to their context",
        "Specific reason 2 relating to their context",
        "Specific reason 3 relating to their context"
      ]
    }
  ]
}

Return ONLY valid JSON. Include 3-5 recommendations sorted by total score (highest first).
`;

  return contextDescription + experiencesDescription + outputSchema;
}

/**
 * Complete prompt package for the AI
 */
export function buildPrompt(userContext: UserContext, experiences: Experience[]) {
  return {
    system: buildSystemPrompt(),
    user: buildUserPrompt(userContext, experiences),
    config: DEFAULT_PROMPT_CONFIG,
  };
}
