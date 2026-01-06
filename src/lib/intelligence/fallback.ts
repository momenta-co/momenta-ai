import type { UserContext, Experience, Recommendation, ScoringBreakdown } from './types';

/**
 * Score how well an experience matches the occasion
 */
function scoreOccasion(experience: Experience, occasion: string): number {
  const occasionLower = occasion.toLowerCase();
  const categories = experience.categories.map(c => c.toLowerCase()).join(' ');
  const title = experience.title.toLowerCase();

  // Simple keyword matching
  if (occasionLower.includes('romántic') || occasionLower.includes('pareja')) {
    if (categories.includes('parejas') || title.includes('romántic')) return 90;
  }
  if (occasionLower.includes('cumpleaños') || occasionLower.includes('celebra')) {
    if (categories.includes('fiesta') || categories.includes('grupos')) return 85;
  }
  if (occasionLower.includes('amigos') || occasionLower.includes('parche')) {
    if (categories.includes('grupos') || categories.includes('fiesta')) return 85;
  }

  return 60; // Default moderate match
}

/**
 * Score how well an experience matches who the user is with
 */
function scoreRelation(experience: Experience, withWho: string): number {
  const withWhoLower = withWho.toLowerCase();
  const categories = experience.categories.map(c => c.toLowerCase()).join(' ');

  if (withWhoLower.includes('pareja') && categories.includes('parejas')) return 95;
  if (withWhoLower.includes('amigos') && categories.includes('grupos')) return 90;
  if (withWhoLower.includes('solo') && categories.includes('individual')) return 90;
  if (withWhoLower.includes('familia') && categories.includes('niños')) return 85;

  return 65; // Default
}

/**
 * Score how well an experience matches the user's mood
 */
function scoreMood(experience: Experience, mood: string): number {
  const moodLower = mood.toLowerCase();
  const categories = experience.categories.map(c => c.toLowerCase()).join(' ');
  const title = experience.title.toLowerCase();

  if (moodLower.includes('relaj') || moodLower.includes('tranquil')) {
    if (categories.includes('bienestar') || title.includes('yoga') || title.includes('masaje')) {
      return 95;
    }
  }
  if (moodLower.includes('aventur') || moodLower.includes('emoción')) {
    if (categories.includes('aventura') || title.includes('polo') || title.includes('parapente')) {
      return 95;
    }
  }
  if (moodLower.includes('creativ') || moodLower.includes('artístic')) {
    if (categories.includes('manualidad') || title.includes('taller')) {
      return 90;
    }
  }
  if (moodLower.includes('gastro') || moodLower.includes('culinari')) {
    if (categories.includes('cocina') || categories.includes('gastronómico')) {
      return 95;
    }
  }

  return 60; // Default
}

/**
 * Score budget compatibility
 */
function scoreBudget(experience: Experience, budget: number): number {
  if (!experience.price || !experience.price.amount) {
    return 70; // Unknown price, moderate score
  }

  const price = parseInt(experience.price.amount);
  const difference = Math.abs(price - budget);
  const percentDiff = difference / budget;

  if (percentDiff <= 0.1) return 100; // Within 10%
  if (percentDiff <= 0.2) return 90; // Within 20%
  if (percentDiff <= 0.3) return 80; // Within 30%
  if (price > budget * 1.5) return 20; // Way over budget
  if (price > budget) return 40; // Over budget

  return 75; // Under budget
}

/**
 * Calculate overall scoring breakdown
 */
function calculateScoring(
  experience: Experience,
  userContext: UserContext
): ScoringBreakdown {
  const occasion = scoreOccasion(experience, userContext.occasion);
  const relation = scoreRelation(experience, userContext.withWho);
  const mood = scoreMood(experience, userContext.mood);
  const budget = scoreBudget(experience, userContext.budget);

  const total = Math.round((occasion + relation + mood + budget) / 4);

  return {
    occasion,
    relation,
    mood,
    budget,
    total,
  };
}

/**
 * Generate a conversational paragraph explaining why this experience was chosen
 */
function generateReasons(
  experience: Experience,
  scoreBreakdown: ScoringBreakdown,
  userContext: UserContext
): string {
  const sentences: string[] = [];

  // Start with the strongest match
  if (scoreBreakdown.occasion > 75 && scoreBreakdown.relation > 75) {
    sentences.push(`Elegí esta experiencia porque es perfecta para ${userContext.occasion.toLowerCase()} ${userContext.withWho.toLowerCase()}.`);
  } else if (scoreBreakdown.occasion > 75) {
    sentences.push(`Elegí esta experiencia porque encaja perfectamente con ${userContext.occasion.toLowerCase()}.`);
  } else if (scoreBreakdown.relation > 75) {
    sentences.push(`Esta experiencia es ideal para disfrutar ${userContext.withWho.toLowerCase()}.`);
  } else {
    sentences.push(`Esta experiencia podría ser una buena opción para tu momento.`);
  }

  // Add mood or category context
  if (scoreBreakdown.mood > 75) {
    sentences.push(`Es una experiencia que se alinea con tu estado de ánimo ${userContext.mood.toLowerCase()}.`);
  } else if (experience.categories.length > 0) {
    sentences.push(`Es una experiencia de ${experience.categories[0].toLowerCase()} que podría interesarte.`);
  }

  // Add budget context if relevant
  if (scoreBreakdown.budget > 85) {
    sentences.push(`Además, está dentro de tu presupuesto.`);
  } else if (scoreBreakdown.budget < 50) {
    sentences.push(`Ten en cuenta que está un poco por encima de tu presupuesto, pero podría valer la pena.`);
  }

  // Ensure we have at least 2 sentences
  if (sentences.length < 2) {
    sentences.push(`Es una opción recomendada en ${userContext.city}.`);
  }

  return sentences.join(' ');
}

/**
 * Generate fallback recommendations using simple heuristics
 */
export function generateFallbackRecommendations(
  userContext: UserContext,
  experiences: Experience[]
): Recommendation[] {
  // Score all experiences
  const scoredExperiences = experiences.map(experience => {
    const scoreBreakdown = calculateScoring(experience, userContext);
    const reasons = generateReasons(experience, scoreBreakdown, userContext);

    return {
      experience,
      scoreBreakdown,
      reasons,
    };
  });

  // Sort by total score descending
  scoredExperiences.sort((a, b) => b.scoreBreakdown.total - a.scoreBreakdown.total);

  // Return top 3-5
  return scoredExperiences.slice(0, 5);
}
