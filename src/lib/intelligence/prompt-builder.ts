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
     * amigos → grupales, sociales, divertidas, INCLUYE YOGA/BIENESTAR

   - Ocasión (10%):
     * cumpleaños → celebración, especial, memorable
     * aniversario → romántico, significativo
     * reencuentro → social, conversación

   - Categoría (10%): Coincidencia directa si la piden
     * gastronomia → cocina, cata, chef
     * bienestar → spa, yoga, masaje
     * arte_creatividad → taller, cerámica, pintura
     * aventura → outdoor, activo, adrenalina

     🔎 CATEGORÍAS ESPECÍFICAS - PRIORIZA por palabra clave en TÍTULO:
     Si categoria es específica, PRIORIZA experiencias que contengan estas palabras en el título:
     * italiana → PRIORIZA experiencias con "Pasta" en título (score +30)
     * japonesa → PRIORIZA experiencias con "Sushi" en título (score +30)
     * mexicana → PRIORIZA experiencias con "Tamalitos" o "Mexicano" en título (score +30)
     * parrilla → PRIORIZA experiencias con "Parrillero" en título (score +30)
     * saludable → PRIORIZA experiencias con "Saludable" en título (score +30)
     * reposteria → PRIORIZA experiencias con "Cake" en título (score +30)
     * cafe → PRIORIZA experiencias con "Café" en título (score +30)
     * vino → PRIORIZA experiencias con "Vino" en título (score +30)
     * cerveza → PRIORIZA experiencias con "Cerveza" o "Cervecera" en título (score +30)
     * licores → PRIORIZA experiencias con "Licores" en título (score +30)
     * cocteles → PRIORIZA experiencias con "Coctelería" en título (score +30)

     ⚠️ CRÍTICO: Si la categoría es específica (italiana, japonesa, etc.), la experiencia que coincida
     DEBE estar en el TOP 3 de recomendaciones. No la pongas en posición 4 o 5.

     🍽️ REGLA DE COHERENCIA GASTRONÓMICA:
     Si la categoría es de COMIDA (italiana, japonesa, mexicana, parrilla, saludable, reposteria)
     o de BEBIDAS (cafe, vino, cerveza, licores, cocteles):
     → TODAS las 5 recomendaciones DEBEN ser de COCINA o BEBIDAS
     → NO incluyas: masajes, spa, yoga, cerámica, kintsugi, manualidades, aventura
     → Solo incluye experiencias con tags: Cocina, Gastronómico, o relacionados con comida/bebida
     → Busca en el título/categorías: Pasta, Sushi, Tamalitos, Parrillero, Café, Vino, Cerveza, Coctelería, Cata, Chef, Brunch

     🏔️ REGLA ESCAPADA CULINARIA (MUY IMPORTANTE):
     Si la ciudad es "Cerca a Bogotá" Y la categoría es "cocina" o "gastronomia":
     → PRIORIZA experiencias con "Neusa" en el título (score +40)
     → "Taller de Cocina En Neusa" DEBE estar en el TOP 2 de recomendaciones
     → "Taller de Manualidades En Neusa" también es buena opción para escapadas
     → Estas son experiencias de ESCAPADA culinaria, perfectas para momentos íntimos fuera de la ciudad
     → Razón: El Neusa ofrece un ambiente tranquilo y especial para cocinar juntos

   - Presupuesto (5%): Solo como restricción suave
     * bajo < 100,000 COP
     * medio 100,000-250,000 COP
     * alto > 250,000 COP

🟢 PRIORIDAD 3 (20% del score) - AJUSTE FINO:
   - Nivel de Energía (8%) - ⚠️ CRÍTICO PARA RECOMENDACIONES:
     * slow_cozy (tranquilo/relajado):
       ✅ INCLUYE: spa, masajes, yoga suave, catas tranquilas, meditación, picnic
       ❌ EXCLUYE SIEMPRE: parapente, escalada, deportes extremos, escape rooms, actividades físicas intensas

     * calm_mindful (íntimo/romántico):
       ✅ INCLUYE: cenas privadas, catas de vino, spa en pareja, experiencias a solas
       ❌ EXCLUYE: actividades de aventura, deportes, planes grupales ruidosos

     * uplifting (activo/divertido):
       ✅ INCLUYE: talleres de cocina, escape rooms, actividades outdoor, deportes suaves
       ❌ EXCLUYE: experiencias muy pasivas, meditación silenciosa

     * social (fiesta/parche):
       ✅ INCLUYE: experiencias grupales, cocteles, ambiente animado
       ❌ EXCLUYE: experiencias individuales silenciosas

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

⚠️ REGLAS OBLIGATORIAS - LEE CON CUIDADO:

1️⃣ EXACTAMENTE 5 RECOMENDACIONES:
   - Ni más ni menos de 5
   - Si no hay 5 experiencias que encajen perfecto, incluye las mejores disponibles

2️⃣ IDs Y TÍTULOS ÚNICOS OBLIGATORIOS:
   - NUNCA repitas el mismo experienceId
   - NUNCA repitas el mismo TÍTULO de experiencia (aunque tenga diferente ID)
   - Usa 5 IDs DIFERENTES: ej. exp-0, exp-2, exp-5, exp-8, exp-12
   - ❌ Si repites un ID o un título, LA RESPUESTA SERÁ RECHAZADA
   - ⚠️ REVISA la lista de experiencias: si ves el mismo título dos veces, SOLO usa UNO de ellos

3️⃣ RESPETAR NIVEL DE ENERGÍA:
   - Si nivelEnergia=slow_cozy → ❌ NO incluyas: parapente, escalada, deportes, aventura
   - Si nivelEnergia=calm_mindful → ❌ NO incluyas: actividades extremas o ruidosas
   - PENALIZA con score bajo (30-40) cualquier experiencia que contradiga el nivel de energía

4️⃣ ORDEN:
   - Ordena por total score (mayor primero)

🧘 REGLA ESPECIAL - YOGA/BIENESTAR PARA AMIGAS:
Si el tipoGrupo es "amigos" (especialmente amigas), SIEMPRE incluye al menos
UNA experiencia de yoga, spa o bienestar entre las 5 recomendaciones.
El yoga con amigas es MUY popular - puede ser Hot Yoga, Yoga & Brunch, Spa Day, etc.`;
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
EJEMPLO CONCRETO - MUY IMPORTANTE LEER
═══════════════════════════════════════════════════

🔴 EJEMPLO 1: Usuario busca algo "tranquilo" (slow_cozy)
INCLUYE:
- "Masaje Relajante" → priority3 = 95 ✅
- "Hot Yoga & Brunch" → priority3 = 85 ✅
- "Cata de Vinos privada" → priority3 = 80 ✅

NO INCLUYAS:
- "Vuelo en Parapente" → priority3 = 15 ❌ (aventura ≠ tranquilo)
- "Taller de Cocina" → priority3 = 35 ❌ (activo ≠ tranquilo)
- "Escape Room" → priority3 = 20 ❌ (intenso ≠ tranquilo)

🔴 EJEMPLO 2: Usuario busca algo "íntimo/romántico" (calm_mindful)
INCLUYE:
- "Cena con Chef Privado" → priority3 = 95 ✅
- "Spa en Pareja" → priority3 = 90 ✅

NO INCLUYAS:
- "Vuelo en Parapente" → priority3 = 15 ❌
- "Escape Room" → priority3 = 25 ❌

🔴 EJEMPLO 3: Usuario busca "cocina + cerca de Bogotá + íntimo" (ESCAPADA CULINARIA)
→ Ciudad: "Cerca a Bogotá"
→ Categoría: cocina
→ nivelEnergia: calm_mindful

OBLIGATORIO INCLUIR EN TOP 2:
- "Taller de Cocina En Neusa" → priority2 = 100, priority3 = 95 ✅ (ESCAPADA + COCINA + ÍNTIMO)
- "Taller de Manualidades En Neusa" → priority2 = 85 ✅ (buena alternativa)

TAMBIÉN INCLUYE:
- Otras experiencias de cocina disponibles

⚠️ CRÍTICO: Si el usuario pide escapada + cocina, "Taller de Cocina En Neusa" DEBE estar en posición 1 o 2.

⚠️ REGLA: Si una experiencia contradice el nivel de energía, NO LA INCLUYAS en las 5 recomendaciones.

═══════════════════════════════════════════════════
RESPUESTA
═══════════════════════════════════════════════════

Devuelve 5 experiencias en JSON válido.
Escribe "reasons" como amiga entusiasta, NO como robot.
Asegúrate de que las experiencias recomendadas REALMENTE encajen con el nivel de energía solicitado.

🧘 IMPORTANTE PARA PLANES CON AMIGAS:
Si el tipoGrupo es "amigos", INCLUYE al menos UNA experiencia de yoga/bienestar/spa.
Yoga con amigas es muy popular (Hot Yoga, Yoga & Brunch, Spa Day, etc.).
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
