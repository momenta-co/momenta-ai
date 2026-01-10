/**
 * Context Extractor - Extrae y acumula contexto de la conversación
 *
 * Este módulo analiza todos los mensajes del usuario para:
 * 1. Extraer información ya proporcionada (personas, ciudad, fecha, etc.)
 * 2. Inferir mood/energía de sinónimos y expresiones coloquiales
 * 3. Evitar que el AI pregunte información que ya se dio
 */

import type { NivelEnergia, TipoGrupo, Modalidad } from './types';

// ============================================
// DICCIONARIO EXTENSO DE SINÓNIMOS DE MOOD
// ============================================

export const MOOD_SYNONYMS: Record<string, string[]> = {
  // ROMÁNTICO / ÍNTIMO → calm_mindful
  romantica: [
    'íntimo', 'intimo', 'romántico', 'romantico', 'especial', 'a solas',
    'privado', 'exclusivo', 'solo nosotros', 'para dos', 'amor',
    'enamorados', 'luna de miel', 'escapada romántica', 'noche especial',
    'velada', 'sensual', 'seducción', 'seduccion', 'conquista',
    'cena íntima', 'momento especial', 'conexión', 'conexion',
    'cercano', 'acogedor', 'cálido', 'calido', 'personal',
  ],

  // FIESTA / SOCIAL → social
  social: [
    'fiesta', 'rumba', 'parche', 'celebración', 'celebracion', 'festejo',
    'parranda', 'juerga', 'salir de fiesta', 'ambiente', 'animado',
    'movido', 'con ambiente', 'mucha gente', 'social', 'grupo grande',
    'todos juntos', 'vacilón', 'vacilon', 'gozadera', 'pachanga',
    'reventón', 'reventon', 'farra', 'noche loca', 'salir a bailar',
    'bailable', 'música', 'musica', 'dj', 'discoteca', 'bar',
    'happy hour', 'after office', 'viernes social', 'networking',
    'conocer gente', 'ambiente festivo', 'brindis', 'shots',
    'trago', 'tragos', 'copas', 'cocteles', 'cocktails',
  ],

  // TRANQUILO / RELAJADO → slow_cozy
  tranquila: [
    'relax', 'relajante', 'relajado', 'relajada', 'chill', 'tranqui',
    'tranquilo', 'tranquila', 'descansar', 'desconectar', 'zen',
    'calma', 'calmado', 'calmada', 'paz', 'peaceful', 'sereno',
    'sin afán', 'sin afan', 'slow', 'lento', 'suave', 'soft',
    'meditación', 'meditacion', 'mindfulness', 'respiro', 'escape',
    'spa', 'masaje', 'wellness', 'bienestar', 'autocuidado',
    'consentirme', 'consentirse', 'mimarse', 'desestresarse',
    'bajar revoluciones', 'tomar aire', 'resetear', 'recargar',
    'energías', 'energias', 'contemplativo', 'silencio', 'quieto',
    'sin ruido', 'apartado', 'alejado', 'naturaleza', 'campo',
    'aire libre tranquilo', 'picnic chill', 'atardecer', 'sunset',
  ],

  // ACTIVO / DIVERTIDO → uplifting
  activa: [
    'aventura', 'aventurero', 'emocionante', 'activo', 'activa',
    'diferente', 'loco', 'loca', 'extremo', 'adrenalina', 'intenso',
    'dinámico', 'dinamico', 'energético', 'energetico', 'movimiento',
    'acción', 'accion', 'deportivo', 'fitness', 'ejercicio',
    'outdoor', 'al aire libre', 'naturaleza activa', 'senderismo',
    'hiking', 'trekking', 'escalada', 'rafting', 'kayak',
    'bicicleta', 'ciclismo', 'running', 'correr', 'caminar',
    'explorar', 'descubrir', 'nuevo', 'experiencia única',
    'memorable', 'inolvidable', 'wow', 'increíble', 'increible',
    'épico', 'epico', 'challenge', 'reto', 'desafío', 'desafio',
    'superar', 'lograr', 'divertido', 'entretenido', 'animado',
    'juegos', 'competencia', 'team building', 'escape room',
    'chimba', 'bacano', 'chevere', 'chévere', 'genial', 'brutal',
  ],
};

// Invertir el diccionario para búsqueda rápida
export const SYNONYM_TO_MOOD: Record<string, NivelEnergia> = {};
for (const [mood, synonyms] of Object.entries(MOOD_SYNONYMS)) {
  const moodMapping: Record<string, NivelEnergia> = {
    romantica: 'calm_mindful',
    social: 'social',
    tranquila: 'slow_cozy',
    activa: 'uplifting',
  };

  for (const synonym of synonyms) {
    SYNONYM_TO_MOOD[synonym.toLowerCase()] = moodMapping[mood];
  }
}

// ============================================
// PATRONES DE EXTRACCIÓN
// ============================================

// Patrones para número de personas
const PERSONA_PATTERNS = [
  { pattern: /\b(\d+)\s*(personas?|pax|gente|invitados?)\b/i, extract: (m: RegExpMatchArray) => parseInt(m[1]) },
  { pattern: /\bsomos\s*(\d+)\b/i, extract: (m: RegExpMatchArray) => parseInt(m[1]) },
  { pattern: /\b(dos|2)\s*(personas?)?\b/i, extract: () => 2 },
  { pattern: /\b(tres|3)\s*(personas?)?\b/i, extract: () => 3 },
  { pattern: /\b(cuatro|4)\s*(personas?)?\b/i, extract: () => 4 },
  { pattern: /\b(cinco|5)\s*(personas?)?\b/i, extract: () => 5 },
  { pattern: /\b(seis|6)\s*(personas?)?\b/i, extract: () => 6 },
  { pattern: /\b(siete|7)\s*(personas?)?\b/i, extract: () => 7 },
  { pattern: /\b(ocho|8)\s*(personas?)?\b/i, extract: () => 8 },
  { pattern: /\b(nueve|9)\s*(personas?)?\b/i, extract: () => 9 },
  { pattern: /\b(diez|10)\s*(personas?)?\b/i, extract: () => 10 },
  { pattern: /\bsol[oa]\b/i, extract: () => 1 },
  { pattern: /\bconmigo\s+mism[oa]\b/i, extract: () => 1 },
];

// Patrones para tipo de grupo
const GRUPO_PATTERNS: { pattern: RegExp; grupo: TipoGrupo; personas?: number }[] = [
  { pattern: /\b(mi\s+)?(novi[oa]|nobi[oa]|pareja|esposo|esposa|prometid[oa]|marido|mujer)\b/i, grupo: 'pareja', personas: 2 },
  { pattern: /\b(mi\s+)?(mamá|mama|papá|papa|padre|madre|hermano|hermana|familia|familiares|abuelo|abuela|tío|tia|primo|prima|sobrino|sobrina)\b/i, grupo: 'familia' },
  { pattern: /\b(mis\s+)?(amig[oa]s?|parche|parceros?|parceras?|compañer[oa]s?|cuadro|grupo|banda|combo)\b/i, grupo: 'amigos' },
  { pattern: /\bsol[oa]\b/i, grupo: 'sola', personas: 1 },
  { pattern: /\bconmigo\s+mism[oa]\b/i, grupo: 'sola', personas: 1 },
  { pattern: /\bpara\s+m[ií]\b/i, grupo: 'sola', personas: 1 },
];

// Patrones para ciudad
// IMPORTANTE: El orden importa - patrones más específicos primero
const CIUDAD_PATTERNS: { pattern: RegExp; ciudad: string }[] = [
  // "Cerca a Bogotá" patterns - MÁS ESPECÍFICOS PRIMERO
  // Variaciones de "fuera de bogota/bogotá"
  { pattern: /\bfuera\s+de\s+bogot[áa]?\b/i, ciudad: 'Cerca a Bogotá' },
  { pattern: /\bfuera\s+de\s+la\s+ciudad\b/i, ciudad: 'Cerca a Bogotá' },
  { pattern: /\bno\s+en\s+bogot[áa]?\b/i, ciudad: 'Cerca a Bogotá' },
  // "cerca a/de bogota"
  { pattern: /\bcerca\s+(a|de)\s+bogot[áa]?\b/i, ciudad: 'Cerca a Bogotá' },
  { pattern: /\bcerquita\s+(a|de)\s+bogot[áa]?\b/i, ciudad: 'Cerca a Bogotá' },
  // escapada / afueras
  { pattern: /\b(afueras|escapada|escapar)\b/i, ciudad: 'Cerca a Bogotá' },
  { pattern: /\bsalir\s+de\s+(la\s+)?ciudad\b/i, ciudad: 'Cerca a Bogotá' },
  // Ciudades directas - DESPUÉS de los patrones de "cerca/fuera" (incluye abreviaturas comunes)
  // NOTA: Medellín ya no está disponible, solo Bogotá y cerca de Bogotá
  { pattern: /\b(en\s+)?(bogot[áa]?|vogota|bog)\b/i, ciudad: 'Bogotá' },
];

// Patrones para fechas
const FECHA_PATTERNS = [
  /\b(hoy|mañana|manana|pasado\s+mañana)\b/i,
  /\b((este|próximo|proximo|el)\s+)?(fin\s+de\s+semana|finde|sábado|sabado|savado|domingo|lunes|martes|miércoles|miercoles|jueves|viernes)\b/i,
  /\b(el|para\s+el)\s+(\d{1,2})\s+(de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/i,
  /\b(en\s+)?(una|dos|tres)\s+semanas?\b/i,
  /\b(la\s+)?próxima\s+semana\b/i,
];

// Patrones para ocasiones especiales (cumpleaños, aniversarios, etc.)
const OCASION_PATTERNS: { pattern: RegExp; ocasion: string; needsDateClarification?: boolean }[] = [
  { pattern: /\bcumpleaños|cumple\b/i, ocasion: 'cumpleaños', needsDateClarification: true },
  { pattern: /\baniversario\b/i, ocasion: 'aniversario', needsDateClarification: true },
  { pattern: /\b(día\s+de\s+la\s+madre|día\s+del\s+padre|día\s+del\s+amor|san\s+valent[ií]n)\b/i, ocasion: 'festividad', needsDateClarification: true },
  { pattern: /\bgraduaci[óo]n\b/i, ocasion: 'graduación', needsDateClarification: true },
  { pattern: /\b(despedida\s+de\s+solter[oa]|bachelor|bachelorette)\b/i, ocasion: 'despedida' },
  { pattern: /\breencuentro\b/i, ocasion: 'reencuentro' },
  { pattern: /\bcita\b/i, ocasion: 'cita' },
  { pattern: /\bcelebra(r|ción|cion)?\b/i, ocasion: 'celebración' },
];

// Patrones para modalidad
const MODALIDAD_PATTERNS: { pattern: RegExp; modalidad: Modalidad }[] = [
  { pattern: /\b(en\s+casa|a\s+domicilio|delivery|que\s+vengan)\b/i, modalidad: 'stay_in' },
  { pattern: /\b(al\s+aire\s+libre|outdoor|afuera|exterior|naturaleza|campo|montaña)\b/i, modalidad: 'outdoor' },
  { pattern: /\b(indoor|interior|adentro|bajo\s+techo)\b/i, modalidad: 'indoor' },
];

// ============================================
// PATRONES PARA EXCLUSIONES ("NO quiero yoga", "sin spa")
// ============================================
const EXCLUSION_PATTERNS: { pattern: RegExp; exclusion: string }[] = [
  // Yoga exclusions
  { pattern: /\bno\s+(quiero|queremos)?\s*yoga\b/i, exclusion: 'yoga' },
  { pattern: /\bsin\s+yoga\b/i, exclusion: 'yoga' },
  { pattern: /\bnada\s+de\s+yoga\b/i, exclusion: 'yoga' },
  { pattern: /\bque\s+no\s+sea\s+yoga\b/i, exclusion: 'yoga' },
  { pattern: /\bno\s+sea\s+yoga\b/i, exclusion: 'yoga' },

  // Spa/masaje exclusions
  { pattern: /\bno\s+(quiero|queremos)?\s*spa\b/i, exclusion: 'spa' },
  { pattern: /\bsin\s+spa\b/i, exclusion: 'spa' },
  { pattern: /\bnada\s+de\s+spa\b/i, exclusion: 'spa' },
  { pattern: /\bque\s+no\s+sea\s+spa\b/i, exclusion: 'spa' },
  { pattern: /\bno\s+sea\s+spa\b/i, exclusion: 'spa' },
  { pattern: /\bno\s+(quiero|queremos)?\s*masaje\b/i, exclusion: 'masaje' },
  { pattern: /\bsin\s+masaje\b/i, exclusion: 'masaje' },

  // Adventure/extreme exclusions
  { pattern: /\bno\s+(quiero|queremos)?\s*aventura\b/i, exclusion: 'aventura' },
  { pattern: /\bsin\s+aventura\b/i, exclusion: 'aventura' },
  { pattern: /\bnada\s+(extremo|de\s+aventura)\b/i, exclusion: 'aventura' },

  // Cooking exclusions
  { pattern: /\bno\s+(quiero|queremos)?\s*cocina\b/i, exclusion: 'cocina' },
  { pattern: /\bsin\s+(talleres?\s+de\s+)?cocina\b/i, exclusion: 'cocina' },

  // Alcohol exclusions
  { pattern: /\bsin\s+alcohol\b/i, exclusion: 'alcohol' },
  { pattern: /\bno\s+tomo\s+alcohol\b/i, exclusion: 'alcohol' },
  { pattern: /\bnada\s+de\s+(vino|alcohol|tragos)\b/i, exclusion: 'alcohol' },

  // Generic "ni X ni Y" pattern
  { pattern: /\bni\s+yoga\b/i, exclusion: 'yoga' },
  { pattern: /\bni\s+spa\b/i, exclusion: 'spa' },
  { pattern: /\bni\s+masaje\b/i, exclusion: 'masaje' },
  { pattern: /\bni\s+cocina\b/i, exclusion: 'cocina' },
];

// ============================================
// INTERFACES
// ============================================

export interface ExtractedContext {
  // Prioridad 1
  personas?: number;
  ciudad?: string;
  fecha?: string;

  // Prioridad 2
  tipoGrupo?: TipoGrupo;
  ocasion?: string;
  needsDateClarification?: boolean; // Para preguntar si es para esa fecha o para otra

  // Prioridad 3
  nivelEnergia?: NivelEnergia;
  modalidad?: Modalidad;
  evitar?: string[]; // Cosas a evitar: ["yoga", "spa", "aventura", etc.]

  // Estado del flujo
  userConfirmed?: boolean; // Si el usuario ya confirmó el resumen
  confirmSearchWasShown?: boolean; // Si ya se mostró el resumen con emojis

  // Meta
  extractedFromMessages: string[]; // Qué info se extrajo de qué mensaje
}

// ============================================
// PATRONES DE CONFIRMACIÓN
// ============================================
const CONFIRMATION_PATTERNS = [
  /^s[ií]$/i,
  /^ok(ay)?$/i,
  /^dale/i,
  /^perfecto/i,
  /^listo/i,
  /^va$/i,
  /^correcto/i,
  /^confirm[oa]/i,
  /^busca/i,
  /est[áa]\s*bien/i,
  /as[ií]\s*est[áa]/i,
  /^s[ií]\s*(est[áa]|,)/i,
  /^bien$/i,
];

function isConfirmationMessage(message: string): boolean {
  const clean = message.toLowerCase().trim();
  return CONFIRMATION_PATTERNS.some(p => p.test(clean));
}

// ============================================
// FUNCIÓN PRINCIPAL DE EXTRACCIÓN
// ============================================

/**
 * Extrae contexto acumulado de todos los mensajes del usuario
 */
export function extractAccumulatedContext(
  messages: { role: string; content: string }[]
): ExtractedContext {
  const context: ExtractedContext = {
    extractedFromMessages: [],
  };

  // Detectar si ya se mostró confirmSearch (mensaje con emojis 📍👥📅💫)
  const assistantMessages = messages.filter(m => m.role === 'assistant');
  for (const msg of assistantMessages) {
    if (msg.content && msg.content.includes('📍') && msg.content.includes('👥') && msg.content.includes('📅')) {
      context.confirmSearchWasShown = true;
    }
  }

  const userMessages = messages.filter(m => m.role === 'user');

  // Detectar si el último mensaje del usuario es una confirmación
  if (userMessages.length > 0 && context.confirmSearchWasShown) {
    const lastUserMessage = userMessages[userMessages.length - 1];
    if (isConfirmationMessage(lastUserMessage.content)) {
      context.userConfirmed = true;
      context.extractedFromMessages.push('userConfirmed: true');
    }
  }

  for (const msg of userMessages) {
    const content = msg.content.toLowerCase();

    // Extraer personas
    if (!context.personas) {
      for (const { pattern, extract } of PERSONA_PATTERNS) {
        const match = content.match(pattern);
        if (match) {
          context.personas = extract(match);
          context.extractedFromMessages.push(`personas: ${context.personas}`);
          break;
        }
      }
    }

    // Extraer tipo de grupo (y posiblemente personas)
    if (!context.tipoGrupo) {
      for (const { pattern, grupo, personas } of GRUPO_PATTERNS) {
        if (pattern.test(content)) {
          context.tipoGrupo = grupo;
          context.extractedFromMessages.push(`tipoGrupo: ${grupo}`);
          if (personas && !context.personas) {
            context.personas = personas;
            context.extractedFromMessages.push(`personas (inferido): ${personas}`);
          }
          break;
        }
      }
    }

    // Extraer ciudad
    if (!context.ciudad) {
      for (const { pattern, ciudad } of CIUDAD_PATTERNS) {
        if (pattern.test(content)) {
          context.ciudad = ciudad;
          context.extractedFromMessages.push(`ciudad: ${ciudad}`);
          break;
        }
      }
    }

    // Extraer fecha
    if (!context.fecha) {
      for (const pattern of FECHA_PATTERNS) {
        const match = content.match(pattern);
        if (match) {
          context.fecha = match[0];
          context.extractedFromMessages.push(`fecha: ${context.fecha}`);
          break;
        }
      }
    }

    // Extraer ocasión
    if (!context.ocasion) {
      for (const { pattern, ocasion, needsDateClarification } of OCASION_PATTERNS) {
        if (pattern.test(content)) {
          context.ocasion = ocasion;
          context.needsDateClarification = needsDateClarification;
          context.extractedFromMessages.push(`ocasion: ${ocasion}`);
          break;
        }
      }
    }

    // Extraer modalidad
    if (!context.modalidad) {
      for (const { pattern, modalidad } of MODALIDAD_PATTERNS) {
        if (pattern.test(content)) {
          context.modalidad = modalidad;
          context.extractedFromMessages.push(`modalidad: ${modalidad}`);
          break;
        }
      }
    }

    // Extraer exclusiones ("NO yoga", "sin spa", etc.)
    for (const { pattern, exclusion } of EXCLUSION_PATTERNS) {
      if (pattern.test(content)) {
        if (!context.evitar) {
          context.evitar = [];
        }
        if (!context.evitar.includes(exclusion)) {
          context.evitar.push(exclusion);
          context.extractedFromMessages.push(`evitar: ${exclusion}`);
        }
      }
    }

    // Extraer mood/energía de sinónimos
    if (!context.nivelEnergia) {
      // Buscar palabras del contenido en el diccionario de sinónimos
      const words = content.split(/\s+/);
      for (const word of words) {
        const cleanWord = word.replace(/[.,!?¿¡]/g, '').toLowerCase();
        if (SYNONYM_TO_MOOD[cleanWord]) {
          context.nivelEnergia = SYNONYM_TO_MOOD[cleanWord];
          context.extractedFromMessages.push(`nivelEnergia (de "${cleanWord}"): ${context.nivelEnergia}`);
          break;
        }
      }

      // Buscar frases compuestas
      if (!context.nivelEnergia) {
        for (const [synonym, mood] of Object.entries(SYNONYM_TO_MOOD)) {
          if (synonym.includes(' ') && content.includes(synonym)) {
            context.nivelEnergia = mood;
            context.extractedFromMessages.push(`nivelEnergia (de "${synonym}"): ${context.nivelEnergia}`);
            break;
          }
        }
      }
    }
  }

  // NO inferir número de personas para amigos/familia - siempre preguntar
  // Solo inferimos personas para pareja (2) y sola (1)

  return context;
}

/**
 * Genera instrucciones para el AI sobre qué NO preguntar
 */
export function generateContextReminder(context: ExtractedContext): string {
  const known: string[] = [];

  if (context.ciudad) known.push(`- Ciudad: ${context.ciudad}`);
  if (context.fecha) known.push(`- Fecha: ${context.fecha}`);
  if (context.tipoGrupo) known.push(`- Tipo de grupo: ${context.tipoGrupo}`);
  if (context.personas) known.push(`- Personas: ${context.personas}`);
  if (context.nivelEnergia) known.push(`- Nivel de energía/vibe: ${context.nivelEnergia}`);
  if (context.ocasion) known.push(`- Ocasión: ${context.ocasion}`);
  if (context.modalidad) known.push(`- Modalidad: ${context.modalidad}`);

  // CASO ESPECIAL: El usuario ya confirmó el resumen
  if (context.userConfirmed && context.confirmSearchWasShown) {
    // Solo inferir personas para pareja (2) y sola (1), nunca para amigos/familia
    const inferredPersonas = context.personas || (context.tipoGrupo === 'pareja' ? 2 : context.tipoGrupo === 'sola' ? 1 : undefined);
    return `
🚨🚨🚨 USUARIO YA CONFIRMÓ - LLAMA getRecommendations AHORA 🚨🚨🚨

El usuario dijo que está bien. DEBES llamar getRecommendations INMEDIATAMENTE.
NO llames confirmSearch de nuevo. NO escribas texto.

Llama getRecommendations con estos parámetros:
{
  "ciudad": "${context.ciudad}",
  "fecha": "${context.fecha}",
  "personas": ${inferredPersonas},
  "tipoGrupo": "${context.tipoGrupo}",
  "nivelEnergia": "${context.nivelEnergia}"${context.ocasion ? `,\n  "ocasion": "${context.ocasion}"` : ''}
}
`;
  }

  if (known.length === 0) {
    return '';
  }

  // Verificar si tiene los datos mínimos para llamar a las herramientas
  // Para pareja/sola: ciudad + fecha + tipoGrupo
  // Para amigos/familia: ciudad + fecha + tipoGrupo + personas (NO inferir)
  const needsPersonas = context.tipoGrupo === 'amigos' || context.tipoGrupo === 'familia';
  const hasMinimumData = Boolean(
    context.ciudad &&
    context.fecha &&
    context.tipoGrupo &&
    (!needsPersonas || context.personas) // Solo requiere personas si es amigos/familia
  );

  let reminder = `
⚠️ INFORMACIÓN YA PROPORCIONADA POR EL USUARIO (NO PREGUNTES ESTO DE NUEVO):
${known.join('\n')}
`;

  // Si ya se mostró el resumen, esperar confirmación
  if (context.confirmSearchWasShown && hasMinimumData) {
    reminder += `
📋 Ya mostraste el resumen con emojis. Espera la respuesta del usuario:
- Si confirma (sí, ok, dale, perfecto, está bien) → LLAMA getRecommendations
- Si quiere cambiar algo → Pregunta qué quiere ajustar
`;
    return reminder;
  }

  if (hasMinimumData) {
    // Solo inferir personas para pareja (2) y sola (1)
    const inferredPersonas = context.personas || (context.tipoGrupo === 'pareja' ? 2 : context.tipoGrupo === 'sola' ? 1 : context.personas);
    reminder += `
🚨 ACCIÓN INMEDIATA REQUERIDA:
Ya tienes los 4 datos mínimos. LLAMA confirmSearch AHORA.

NO ESCRIBAS TEXTO. Solo llama al tool con estos parámetros:
{
  "ciudad": "${context.ciudad}",
  "fecha": "${context.fecha}",
  "personas": ${inferredPersonas},
  "tipoGrupo": "${context.tipoGrupo}",
  "nivelEnergia": "${context.nivelEnergia}"${context.ocasion ? `,\n  "ocasion": "${context.ocasion}"` : ''}
}

⚠️ PROHIBIDO escribir resúmenes como texto. El tool genera el mensaje con emojis.
`;
  } else {
    const missing: string[] = [];
    if (!context.ciudad) missing.push('ciudad');
    if (!context.fecha) missing.push('fecha');
    if (!context.tipoGrupo) missing.push('tipo de grupo');
    // Para amigos/familia, siempre preguntar cuántos son
    if (needsPersonas && !context.personas) missing.push('número de personas');

    if (missing.length > 0) {
      reminder += `
📋 Aún falta: ${missing.join(', ')}
→ Pregunta SOLO por lo que falta en UN solo mensaje.
`;
    }
  }

  return reminder;
}

/**
 * Detecta si el usuario mencionó una fecha especial que requiere clarificación
 */
export function needsDateClarification(context: ExtractedContext): boolean {
  return Boolean(context.needsDateClarification && context.ocasion && !context.fecha);
}

/**
 * Genera la pregunta de clarificación de fecha
 */
export function getDateClarificationQuestion(context: ExtractedContext): string {
  const ocasionMessages: Record<string, string> = {
    cumpleaños: '¿Quieres la experiencia para el día del cumple o prefieres celebrarlo en otra fecha?',
    aniversario: '¿La experiencia sería para el día del aniversario o para celebrarlo en otra fecha?',
    festividad: '¿Quieres algo para ese día exacto o para celebrarlo cuando les quede mejor?',
    graduación: '¿Para el día de la graduación o para celebrar después?',
  };

  return ocasionMessages[context.ocasion || ''] || '¿Para cuándo lo están planeando?';
}
