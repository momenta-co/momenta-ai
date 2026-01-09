import type { UserContext, Experience, Recommendation, ScoringBreakdown } from './types';
import { ENERGY_TAG_MAPPING, GROUP_TAG_MAPPING, CATEGORY_TAG_MAPPING, AVOID_TAG_MAPPING } from './tag-mapping';

/**
 * Score Priority 1: Ciudad, Personas, Fecha (40% weight)
 * These are binary/critical filters
 */
function scorePriority1(experience: Experience, context: UserContext): number {
  let score = 100; // Start with perfect score

  // Ciudad should already be filtered at DB level, but double-check
  if (experience.location && !experience.location.toLowerCase().includes(context.ciudad.toLowerCase())) {
    score -= 50;
  }

  // Personas - check minPeople if available
  if (experience.minPeople && context.personas < experience.minPeople) {
    score -= 30;
  }

  return Math.max(0, score);
}

/**
 * Score Priority 2: Tipo Grupo, Ocasión, Categoría, Presupuesto (35% weight)
 * Usa el mapeo de tags configurado para mejor matching
 */
function scorePriority2(experience: Experience, context: UserContext): number {
  let score = 50; // Base score más neutral
  const expTags = experience.categories.map(c => c.toLowerCase());
  const title = experience.title.toLowerCase();
  const description = experience.description.toLowerCase();

  // Tipo de Grupo matching usando mapeo de tags
  if (context.tipoGrupo && GROUP_TAG_MAPPING[context.tipoGrupo]) {
    const mapping = GROUP_TAG_MAPPING[context.tipoGrupo];

    // Boost por tags que coinciden
    for (const boostTag of mapping.boost) {
      if (expTags.some(t => t.includes(boostTag.toLowerCase()))) {
        score += 20;
      }
    }

    // Penalty por tags que no encajan
    for (const penaltyTag of mapping.penalty) {
      if (expTags.some(t => t.includes(penaltyTag.toLowerCase()))) {
        score -= 15;
      }
    }
  }

  // Ocasión matching
  if (context.ocasion) {
    const ocasion = context.ocasion.toLowerCase();
    if (ocasion.includes('cumpleaños') && (expTags.some(t => t.includes('celebra')) || description.includes('especial'))) {
      score += 10;
    }
    if (ocasion.includes('aniversario') && (expTags.some(t => t.includes('romántic') || t.includes('pareja')))) {
      score += 10;
    }
  }

  // Categoría matching usando mapeo de tags
  if (context.categoria && CATEGORY_TAG_MAPPING[context.categoria]) {
    const categoryTags = CATEGORY_TAG_MAPPING[context.categoria];
    for (const catTag of categoryTags) {
      if (expTags.some(t => t.includes(catTag.toLowerCase()))) {
        score += 20;
      }
    }
  }

  // Presupuesto matching
  if (context.presupuesto && experience.price?.amount) {
    const price = parseInt(experience.price.amount);
    const budgetRanges: Record<string, [number, number]> = {
      'bajo': [0, 100000],
      'medio': [100000, 250000],
      'alto': [250000, Infinity],
    };
    const range = budgetRanges[context.presupuesto];
    if (range && price >= range[0] && price <= range[1]) {
      score += 5;
    }
  }

  return Math.min(100, score);
}

/**
 * Score Priority 3: Nivel Energía, Intención, Evitar (20% weight)
 * Usa el mapeo de tags configurado para scoring preciso
 */
function scorePriority3(experience: Experience, context: UserContext): number {
  let score = 50; // Base score más neutral
  const expTags = experience.categories.map(c => c.toLowerCase());

  // Nivel de Energía - MUY IMPORTANTE - Usa mapeo de tags
  if (context.nivelEnergia && ENERGY_TAG_MAPPING[context.nivelEnergia]) {
    const mapping = ENERGY_TAG_MAPPING[context.nivelEnergia];

    // Boost por tags que coinciden
    for (const boostTag of mapping.boost) {
      if (expTags.some(t => t.includes(boostTag.toLowerCase()))) {
        score += 25; // Boost significativo
      }
    }

    // Penalty por tags que no encajan
    for (const penaltyTag of mapping.penalty) {
      if (expTags.some(t => t.includes(penaltyTag.toLowerCase()))) {
        score -= 30; // Penalización fuerte
      }
    }
  }

  // Intención
  if (context.intencion) {
    const title = experience.title.toLowerCase();
    const description = experience.description.toLowerCase();
    const combined = title + ' ' + description;

    const intentPatterns: Record<string, string[]> = {
      'sorprender': ['único', 'especial', 'exclusivo', 'memorable', 'sorpresa'],
      'compartir': ['juntos', 'compartir', 'grupo'],
      'agradecer': ['especial', 'detalle', 'regalo'],
      'celebrar': ['celebración', 'fiesta', 'festivo', 'cumpleaños'],
    };
    const patterns = intentPatterns[context.intencion] || [];
    if (patterns.some(p => combined.includes(p))) {
      score += 10;
    }
  }

  // Cosas a evitar - PENALIZACIÓN usando mapeo de tags
  if (context.evitar && context.evitar.length > 0) {
    for (const avoid of context.evitar) {
      const avoidTags = AVOID_TAG_MAPPING[avoid] || [];
      for (const avoidTag of avoidTags) {
        if (expTags.some(t => t.includes(avoidTag.toLowerCase()))) {
          score -= 25;
        }
      }
    }
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Score Priority 4: Modalidad, Mood, Conexión (5% weight)
 */
function scorePriority4(experience: Experience, context: UserContext): number {
  let score = 70;
  const combined = (experience.categories.join(' ') + ' ' + experience.title + ' ' + experience.description).toLowerCase();

  // Modalidad
  if (context.modalidad) {
    const modalityPatterns: Record<string, string[]> = {
      'indoor': ['interior', 'salón', 'estudio', 'restaurante'],
      'outdoor': ['aire libre', 'outdoor', 'exterior', 'naturaleza'],
      'stay_in': ['domicilio', 'en casa', 'a tu hogar', 'delivery'],
    };
    const patterns = modalityPatterns[context.modalidad] || [];
    if (patterns.some(p => combined.includes(p))) {
      score += 15;
    }
  }

  return Math.min(100, score);
}

/**
 * Calculate complete scoring breakdown
 */
function calculateScoring(experience: Experience, context: UserContext): ScoringBreakdown {
  const p1 = scorePriority1(experience, context);
  const p2 = scorePriority2(experience, context);
  const p3 = scorePriority3(experience, context);
  const p4 = scorePriority4(experience, context);

  // Weighted total: P1=40%, P2=35%, P3=20%, P4=5%
  const total = Math.round(p1 * 0.40 + p2 * 0.35 + p3 * 0.20 + p4 * 0.05);

  // Map to legacy format for frontend compatibility
  return {
    occasion: p2,
    relation: p2,
    mood: p3,
    budget: p2,
    total,
  };
}

/**
 * Generate conversational reasons
 */
function generateReasons(
  experience: Experience,
  scoreBreakdown: ScoringBreakdown,
  context: UserContext
): string {
  const sentences: string[] = [];

  // Opening based on score
  if (scoreBreakdown.total > 80) {
    sentences.push(`¡Esta me encanta para ${context.tipoGrupo === 'pareja' ? 'ustedes' : 'ti'}!`);
  } else if (scoreBreakdown.total > 65) {
    sentences.push(`Esta opción puede ser genial.`);
  } else {
    sentences.push(`Esta es una alternativa interesante.`);
  }

  // Context-specific reason
  if (context.nivelEnergia === 'slow_cozy') {
    sentences.push(`El ambiente es perfecto para relajarse y desconectar.`);
  } else if (context.nivelEnergia === 'uplifting') {
    sentences.push(`Van a pasarla súper bien con esta experiencia dinámica.`);
  } else if (context.tipoGrupo === 'pareja') {
    sentences.push(`Es una experiencia ideal para disfrutar en pareja.`);
  } else if (context.ocasion) {
    sentences.push(`Es perfecta para celebrar ${context.ocasion.toLowerCase()}.`);
  }

  // Price mention if relevant
  if (experience.price?.amount) {
    const price = parseInt(experience.price.amount);
    if (price > 200000) {
      sentences.push(`Es un poco más especial en precio, pero vale la pena para la ocasión.`);
    }
  }

  return sentences.join(' ');
}

/**
 * Generate fallback recommendations using heuristics
 */
export function generateFallbackRecommendations(
  userContext: UserContext,
  experiences: Experience[]
): Recommendation[] {
  const scoredExperiences = experiences.map(experience => {
    const scoreBreakdown = calculateScoring(experience, userContext);
    const reasons = generateReasons(experience, scoreBreakdown, userContext);

    return {
      experience,
      scoreBreakdown,
      reasons,
    };
  });

  scoredExperiences.sort((a, b) => b.scoreBreakdown.total - a.scoreBreakdown.total);

  return scoredExperiences.slice(0, 5);
}
