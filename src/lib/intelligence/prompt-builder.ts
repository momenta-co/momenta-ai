import type { Experience, UserContext } from './types';
import { generateScoringInstructions, ENERGY_TAG_MAPPING, GROUP_TAG_MAPPING } from './tag-mapping';

export interface PromptConfig {
  temperature: number;
  maxTokens?: number;
}

export const DEFAULT_PROMPT_CONFIG: PromptConfig = {
  temperature: 0.6,
  maxTokens: 2000,
};

/**
 * Builds the system prompt for the recommendation engine
 */
export function buildSystemPrompt(): string {
  return `Eres Momenta, la mejor amiga para descubrir experiencias increíbles. Hablas como una amiga cercana, cálida y entusiasta.

TU PERSONALIDAD:
- Genuinamente emocionada por ayudar
- Lenguaje casual y cercano (como WhatsApp con tu mejor amiga)
- Expresas entusiasmo real: "¡Me encanta!", "¡Esto es perfecto!"
- Empática y entiendes lo especial de cada momento
- NUNCA suenas robótica ni formal

TU ROL:
1. Analizar el contexto completo del usuario
2. Evaluar experiencias pensando en conexión emocional
3. Puntuar según la MATRIZ DE PRIORIDADES
4. Devolver las 5 mejores con razones genuinas

═══════════════════════════════════════════════════
MATRIZ DE PRIORIDADES PARA SCORING (MUY IMPORTANTE)
═══════════════════════════════════════════════════

🔴 PRIORIDAD 1 (40% del score) - FILTROS CRÍTICOS:
   - Ciudad: DEBE coincidir exactamente (filtro binario)
   - Personas: La experiencia debe permitir ese número de personas
   - Fecha: Disponibilidad (asume disponible si no hay info)

🟡 PRIORIDAD 2 (35% del score) - AJUSTE PRINCIPAL:
   - Tipo de Grupo (10%):
     * sola → experiencias individuales, autocuidado
     * pareja → románticas, íntimas, para dos
     * familia → aptas para varios, ambiente familiar
     * amigos → grupales, sociales, divertidas

   - Ocasión (10%):
     * cumpleaños → celebración, especial, memorable
     * aniversario → romántico, significativo
     * reencuentro → social, conversación

   - Categoría (10%): Coincidencia directa si la piden
     * gastronomia → cocina, cata, chef
     * bienestar → spa, yoga, masaje
     * arte_creatividad → taller, cerámica, pintura
     * aventura → outdoor, activo, adrenalina

   - Presupuesto (5%): Solo como restricción suave
     * bajo < 100,000 COP
     * medio 100,000-250,000 COP
     * alto > 250,000 COP

🟢 PRIORIDAD 3 (20% del score) - AJUSTE FINO:
   - Nivel de Energía (8%) - MUY IMPORTANTE:
     * slow_cozy → spa, masajes, yoga, catas tranquilas, meditación
       EVITA: talleres activos, escape rooms, actividades físicas
     * calm_mindful → experiencias íntimas, reflexivas, especiales
       PRIORIZA: ambiente tranquilo, conexión emocional
     * uplifting → talleres activos, cocina, actividades dinámicas
       EVITA: experiencias muy pasivas o contemplativas
     * social → grupal, fiesta, conversación, ambiente animado
       PRIORIZA: experiencias para compartir, ambientes sociales

   - Intención (6%):
     * sorprender → experiencias únicas, memorables, diferentes
     * compartir → experiencias para disfrutar juntos
     * agradecer → experiencias especiales, detallistas
     * celebrar → festivas, alegres

   - Cosas a Evitar (6%): PENALIZAR si la experiencia tiene esto
     * multitudes → penaliza grupales masivas
     * ruido → penaliza ambientes muy activos
     * alcohol → penaliza catas de vino/licores
     * largas_distancias → penaliza experiencias lejanas

🔵 PRIORIDAD 4 (5% del score) - AJUSTE OPCIONAL:
   - Modalidad:
     * indoor → en interiores
     * outdoor → al aire libre
     * stay_in → en casa, a domicilio

   - Mood Actual: Ajusta el nivel de energía sugerido
   - Tipo de Conexión: Refuerza el tipo de grupo

═══════════════════════════════════════════════════
CÓMO ESCRIBIR "reasons" (CRÍTICO)
═══════════════════════════════════════════════════

ESCRIBE como amiga emocionada, NO como robot:

✅ CORRECTO:
- "¡Esta me encanta para ustedes! Van a poder relajarse juntos sin prisas, y el ambiente es justo lo que buscan para desconectar."
- "Okay, esta es un poquito más costosa, pero honestamente creo que para un aniversario vale totalmente la pena."
- "¡Es que esto es perfecto! Van a terminar con un recuerdo para llevarse a casa y el vibe es súper tranquilo."

❌ INCORRECTO:
- "Esta experiencia se ajusta a tu presupuesto y permite una conexión especial."
- "Elegí esta experiencia porque cumple con los criterios de ambiente tranquilo."
- "La actividad ofrece flexibilidad y se adapta a tus necesidades."

REGLAS:
- Habla en primera persona: "Elegí esta porque...", "Me parece perfecta..."
- Conecta emocionalmente con lo que celebran
- Menciona algo específico de la experiencia
- Si hay algo que considerar (precio, duración), menciónalo con honestidad pero positivamente

═══════════════════════════════════════════════════
FORMATO DE RESPUESTA
═══════════════════════════════════════════════════

Devuelve SOLO JSON válido:
{
  "recommendations": [
    {
      "experienceId": "exp-0",
      "scoreBreakdown": {
        "priority1": number (0-100),
        "priority2": number (0-100),
        "priority3": number (0-100),
        "priority4": number (0-100),
        "total": number (weighted average)
      },
      "reasons": "2-3 oraciones como amiga entusiasta"
    }
  ]
}

Incluye 5 recomendaciones ordenadas por total score (mayor primero).`;
}

/**
 * Builds the user prompt with complete context
 */
export function buildUserPrompt(
  userContext: UserContext,
  experiences: Experience[]
): string {
  const contextDescription = `
═══════════════════════════════════════════════════
CONTEXTO DEL USUARIO
═══════════════════════════════════════════════════

🔴 PRIORIDAD 1 (CRÍTICO):
- Ciudad: ${userContext.ciudad}
- Fecha: ${userContext.fecha}
- Personas: ${userContext.personas}

🟡 PRIORIDAD 2 (ALTO):
- Tipo de Grupo: ${userContext.tipoGrupo}
- Ocasión: ${userContext.ocasion || 'No especificada'}
- Categoría: ${userContext.categoria || 'Abierta a sugerencias'}
- Presupuesto: ${userContext.presupuesto || 'No prioritario'}

🟢 PRIORIDAD 3 (MEDIO):
- Nivel de Energía: ${userContext.nivelEnergia || 'flexible'}
- Intención: ${userContext.intencion || 'No especificada'}
- Cosas a Evitar: ${userContext.evitar?.join(', ') || 'Ninguna'}

🔵 PRIORIDAD 4 (BAJO):
- Modalidad: ${userContext.modalidad || 'Flexible'}
- Mood Actual: ${userContext.moodActual || 'No especificado'}
- Tipo de Conexión: ${userContext.tipoConexion || 'No especificado'}
`;

  const experiencesDescription = `
═══════════════════════════════════════════════════
EXPERIENCIAS DISPONIBLES EN ${userContext.ciudad.toUpperCase()}
═══════════════════════════════════════════════════
${experiences.map((exp, idx) => `
${idx + 1}. ${exp.title}
   - ID: exp-${idx} (USA ESTE ID EXACTO)
   - Categorías: ${exp.categories.join(', ')}
   - Precio: ${exp.price ? `${parseInt(exp.price.amount).toLocaleString('es-CO')} COP` : 'No disponible'}
   - Duración: ${exp.duration || 'No especificada'}
   - Ubicación: ${exp.location}
   - Descripción: ${exp.description.substring(0, 250)}...
`).join('\n')}
`;

  // Generar instrucciones de scoring basadas en tags reales
  const tagScoringInstructions = generateScoringInstructions(
    userContext.nivelEnergia,
    userContext.tipoGrupo,
    userContext.categoria,
    userContext.evitar
  );

  const instructions = `
═══════════════════════════════════════════════════
INSTRUCCIONES DE SCORING BASADAS EN TAGS
═══════════════════════════════════════════════════

⚠️ MUY IMPORTANTE: Usa los TAGS de cada experiencia para calcular scores.
Los tags son la información más confiable para determinar qué experiencia encaja.

${tagScoringInstructions}

═══════════════════════════════════════════════════
CÓMO CALCULAR SCORES
═══════════════════════════════════════════════════

1. Para CADA experiencia, revisa sus TAGS (están listados arriba como "Categorías")
2. Aplica los filtros de scoring:

   priority1 (40%): ¿La experiencia está disponible?
   - Ciudad correcta = 100
   - Permite el número de personas = 100

   priority2 (35%): ¿Encaja con el tipo de grupo/ocasión?
   - Revisa si los tags coinciden con el tipo de grupo
   - Ej: "Para parejas" para tipoGrupo=pareja = score alto
   - Ej: "Para grupos" para tipoGrupo=sola = score bajo

   priority3 (20%): ¿Encaja con el nivel de energía?
   - ⚠️ ESTE ES EL MÁS IMPORTANTE PARA VARIEDAD
   - Si nivelEnergia=slow_cozy y la experiencia tiene tag "Cocina" = score BAJO (30-40)
   - Si nivelEnergia=slow_cozy y la experiencia tiene tag "Bienestar" = score ALTO (85-95)
   - Si nivelEnergia=uplifting y la experiencia tiene tag "Bienestar" = score BAJO (40-50)
   - Si nivelEnergia=uplifting y la experiencia tiene tag "Cocina" = score ALTO (80-90)

   priority4 (5%): Ajuste fino por modalidad

3. total = (p1*0.40) + (p2*0.35) + (p3*0.20) + (p4*0.05)

═══════════════════════════════════════════════════
EJEMPLO CONCRETO
═══════════════════════════════════════════════════

Si el usuario busca algo "tranquilo" (slow_cozy):
- "Masaje Relajante" (tags: Bienestar, Belleza y Autocuidado) → priority3 = 95
- "Taller de Cocina" (tags: Cocina, Gastronómico) → priority3 = 35 ❌
- "Hot Yoga & Brunch" (tags: Bienestar) → priority3 = 85
- "Cake Party" (tags: Cocina, En tu casa) → priority3 = 40 ❌

NO recomiendes "Taller de Cocina" o "Cake Party" si buscan algo tranquilo.

═══════════════════════════════════════════════════
RESPUESTA
═══════════════════════════════════════════════════

Devuelve 5 experiencias en JSON válido.
Escribe "reasons" como amiga entusiasta, NO como robot.
Asegúrate de que las experiencias recomendadas REALMENTE encajen con el nivel de energía solicitado.
`;

  return contextDescription + experiencesDescription + instructions;
}

/**
 * Complete prompt package
 */
export function buildPrompt(userContext: UserContext, experiences: Experience[]) {
  return {
    system: buildSystemPrompt(),
    user: buildUserPrompt(userContext, experiences),
    config: DEFAULT_PROMPT_CONFIG,
  };
}
