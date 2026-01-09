/**
 * Mapeo de Tags para Fine-Tuning de Recomendaciones
 *
 * Este archivo define cómo las variables del usuario (nivel de energía, tipo de grupo, etc.)
 * se mapean a los tags reales de las experiencias en la base de datos.
 */

// Tags reales en la base de datos
export const AVAILABLE_TAGS = [
  'Aventura',
  'Belleza y Autocuidado',
  'Bienestar',
  'Cerca a Bogotá',
  'Cocina',
  'Corporativo',
  'En Bogotá',
  'En tu casa',
  'Fiesta',
  'Gastronómico',
  'Individual',
  'Manualidad',
  'Online',
  'Para grupos',
  'Para niños',
  'Para Niños',
  'Para parejas',
] as const;

/**
 * MAPEO DE NIVEL DE ENERGÍA A TAGS
 *
 * Define qué tags son ideales (boost) y cuáles evitar (penalty) para cada nivel de energía
 */
export const ENERGY_TAG_MAPPING: Record<string, { boost: string[]; penalty: string[]; description: string }> = {
  slow_cozy: {
    description: 'Tranquilo, relajado, calma, zen, descansar',
    boost: [
      'Bienestar',           // Spa, yoga, masajes
      'Belleza y Autocuidado', // Tratamientos faciales, manicure
      'En tu casa',          // Experiencias a domicilio (más relajado)
    ],
    penalty: [
      'Cocina',              // Talleres de cocina son activos
      'Aventura',            // Actividades de adrenalina
      'Fiesta',              // Ambientes ruidosos
      'Para grupos',         // Puede ser muy social/ruidoso
    ],
  },
  calm_mindful: {
    description: 'Íntimo, especial, romántico, reflexivo',
    boost: [
      'Para parejas',        // Experiencias románticas
      'Bienestar',           // Spa para dos
      'Belleza y Autocuidado',
      'Gastronómico',        // Cenas especiales
      'En tu casa',          // Privacidad
    ],
    penalty: [
      'Para grupos',         // No es íntimo
      'Fiesta',              // Muy ruidoso
      'Corporativo',         // No es romántico
      'Para niños',          // No es íntimo
    ],
  },
  uplifting: {
    description: 'Activo, divertido, movido, aventura',
    boost: [
      'Cocina',              // Talleres de cocina activos
      'Manualidad',          // Talleres creativos
      'Aventura',            // Actividades outdoor
      'Gastronómico',        // Experiencias culinarias
    ],
    penalty: [
      'Bienestar',           // Muy pasivo para este mood
      'Online',              // Prefieren presencial activo
    ],
  },
  social: {
    description: 'Parche, fiesta, social, conversación',
    boost: [
      'Para grupos',         // Experiencias grupales
      'Fiesta',              // Ambiente de fiesta
      'Cocina',              // Cocinar en grupo
      'Gastronómico',        // Compartir comida
    ],
    penalty: [
      'Individual',          // Muy solitario
      'En tu casa',          // Menos social
    ],
  },
};

/**
 * MAPEO DE TIPO DE GRUPO A TAGS
 */
export const GROUP_TAG_MAPPING: Record<string, { boost: string[]; penalty: string[] }> = {
  sola: {
    boost: ['Individual', 'Bienestar', 'Belleza y Autocuidado'],
    penalty: ['Para grupos', 'Para parejas', 'Fiesta'],
  },
  pareja: {
    boost: ['Para parejas', 'Gastronómico', 'Bienestar'],
    penalty: ['Para grupos', 'Corporativo', 'Para niños'],
  },
  familia: {
    boost: ['Para niños', 'Para Niños', 'Cocina', 'Manualidad'],
    penalty: ['Corporativo', 'Fiesta'],
  },
  amigos: {
    boost: ['Para grupos', 'Cocina', 'Fiesta', 'Gastronómico', 'Aventura'],
    penalty: ['Individual', 'Corporativo'],
  },
};

/**
 * MAPEO DE CATEGORÍA SOLICITADA A TAGS
 */
export const CATEGORY_TAG_MAPPING: Record<string, string[]> = {
  gastronomia: ['Cocina', 'Gastronómico'],
  bienestar: ['Bienestar', 'Belleza y Autocuidado'],
  arte_creatividad: ['Manualidad'],
  aventura: ['Aventura', 'Cerca a Bogotá'],
  cultural: ['Manualidad'], // Actividades artísticas/culturales
};

/**
 * COSAS A EVITAR - Mapeo a tags
 */
export const AVOID_TAG_MAPPING: Record<string, string[]> = {
  multitudes: ['Para grupos', 'Fiesta'],
  ruido: ['Fiesta', 'Para grupos'],
  alcohol: ['Gastronómico'], // Catas de vino/licores
  largas_distancias: ['Cerca a Bogotá', 'Aventura'],
};

/**
 * Función para calcular score de tags
 */
export function calculateTagScore(
  experienceTags: string[],
  boostTags: string[],
  penaltyTags: string[]
): number {
  let score = 0;
  const normalizedExpTags = experienceTags.map(t => t.toLowerCase());

  for (const boost of boostTags) {
    if (normalizedExpTags.some(t => t.includes(boost.toLowerCase()))) {
      score += 20; // Boost por tag coincidente
    }
  }

  for (const penalty of penaltyTags) {
    if (normalizedExpTags.some(t => t.includes(penalty.toLowerCase()))) {
      score -= 25; // Penalización por tag no deseado
    }
  }

  return score;
}

/**
 * Genera instrucciones de scoring basadas en el contexto del usuario
 */
export function generateScoringInstructions(
  nivelEnergia?: string,
  tipoGrupo?: string,
  categoria?: string,
  evitar?: string[]
): string {
  const instructions: string[] = [];

  if (nivelEnergia && ENERGY_TAG_MAPPING[nivelEnergia]) {
    const mapping = ENERGY_TAG_MAPPING[nivelEnergia];
    instructions.push(`
📊 FILTRO POR NIVEL DE ENERGÍA (${mapping.description}):
   ✅ PRIORIZA experiencias con tags: ${mapping.boost.join(', ')}
   ❌ PENALIZA experiencias con tags: ${mapping.penalty.join(', ')}
   → Si una experiencia tiene tags de PENALTY, su score de energía debe ser BAJO (< 40)
   → Si una experiencia tiene tags de BOOST, su score de energía debe ser ALTO (> 75)`);
  }

  if (tipoGrupo && GROUP_TAG_MAPPING[tipoGrupo]) {
    const mapping = GROUP_TAG_MAPPING[tipoGrupo];
    instructions.push(`
📊 FILTRO POR TIPO DE GRUPO (${tipoGrupo}):
   ✅ PRIORIZA experiencias con tags: ${mapping.boost.join(', ')}
   ❌ PENALIZA experiencias con tags: ${mapping.penalty.join(', ')}`);
  }

  if (categoria && CATEGORY_TAG_MAPPING[categoria]) {
    const tags = CATEGORY_TAG_MAPPING[categoria];
    instructions.push(`
📊 FILTRO POR CATEGORÍA (${categoria}):
   ✅ PRIORIZA experiencias con tags: ${tags.join(', ')}
   → Experiencias sin estos tags deben tener score de categoría BAJO (< 50)`);
  }

  if (evitar && evitar.length > 0) {
    const avoidTags = evitar.flatMap(e => AVOID_TAG_MAPPING[e] || []);
    if (avoidTags.length > 0) {
      instructions.push(`
📊 COSAS A EVITAR:
   ❌ EXCLUYE o PENALIZA FUERTEMENTE experiencias con tags: ${avoidTags.join(', ')}
   → Estas experiencias deben tener score MUY BAJO o no aparecer`);
    }
  }

  return instructions.join('\n');
}
