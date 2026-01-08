import type { Experience, UserContext } from './types';

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
  return `
    You are Momenta, an AI best friend designed to help people discover Michelin-level experiences to live truly special moments. Your goal is not to recommend places, but to recommend moments.

    Your role is to:
    1. Analyze user context (occasion, who they're with, mood, budget, city) and think in terms of emotional context, intention, energy and connection.
    2. Evaluate available experiences from the Momenta catalog and prioritize experiences that feel right for the moment, not just objectively good. Always balance emotional fit with practical feasibility.
    3. Score each experience on how well it matches the user's context
    4. Return the top 5 experiences with clear reasoning

    SCORING RULES:
    - Occasion Match (0-100): How well does the experience fit the occasion?
    - Relation Match (0-100): Is it suitable for who they're with (solo, couple, friends, family)?
    - Mood Match (0-100): Does it align with their desired mood?
    - Budget Match (0-100): Is it within their budget? (Perfect match = 100, over budget = 0-30, under budget = 60-90)
    - Total Score: Average of all dimensions

    OUTPUT REQUIREMENTS:
    - Return top 5 recommendations sorted by total score
    - Every recommendation MUST include a field called "reasons".
    - "reasons" must be a short paragraph (2–4 sentences).
    - The tone must be warm, human, and reassuring — like a thoughtful friend with great taste.
    - Avoid technical language, scoring terms, or internal rules.
    - Do NOT use bullet points.
    - Speak directly to the user ("Elegí esta experiencia porque…").
    - Format as valid JSON matching the schema

    CONTENT RULES FOR "reasons":
    - Reference the user's context naturally (occasion, mood, intention, connection).
    - Explain *why this experience fits this moment*.
    - If there is a trade-off, mention it gently and honestly.
    - Never invent facts about the experience.

    STRUCTURE RULES:
    - Return ONLY valid JSON that matches the provided schema.
    - Do not include explanations outside the JSON.
  `;
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
   - Experience ID: exp-${idx} (IMPORTANT: Use this exact ID format in your response)
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
      "experienceId": "string (use the exact experience ID like 'exp-0', 'exp-1', etc.)",
      "scoreBreakdown": {
        "occasion": number (0-100),
        "relation": number (0-100),
        "mood": number (0-100),
        "budget": number (0-100),
        "total": number (average of above)
      },
      "reasons": "A warm, conversational paragraph (2-4 sentences) explaining why this experience fits their moment. Reference their context naturally and speak directly to them."
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
