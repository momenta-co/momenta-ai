import { streamText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { generateAIRecommendations } from '@/lib/intelligence/ai-service';
import { getExperiencesByCity } from '@/lib/db/experiences';
import type { UserContext, TipoGrupo, NivelEnergia, Presupuesto } from '@/lib/intelligence/types';

// ============================================
// PRE-FILTER: Detect off-topic messages locally
// ============================================

const MOMENTA_KEYWORDS = [
  'hola', 'buenos días', 'buenas tardes', 'buenas noches', 'hey', 'hi', 'hello',
  'experiencia', 'experiencias', 'plan', 'planes', 'actividad', 'actividades',
  'cumpleaños', 'aniversario', 'cita', 'romántico', 'romántica', 'celebración',
  'celebrar', 'evento', 'salida', 'paseo',
  'familia', 'amigos', 'pareja', 'novio', 'novia', 'esposo', 'esposa', 'mamá', 'papá',
  'grupo', 'personas', 'solos', 'solo', 'sola',
  'relajante', 'relajado', 'aventura', 'divertido', 'tranquilo', 'especial',
  'presupuesto', 'precio',
  'bogotá', 'medellín', 'ciudad', 'cerca', 'escapada', 'afueras', 'fuera de la ciudad',
  'restaurante', 'comida', 'spa', 'bienestar', 'arte',
  'busco', 'quiero', 'necesito', 'me gustaría', 'ayuda',
  'qué', 'cuál', 'cómo', 'dónde', 'cuándo',
  'momenta', 'boutique',
  'sí', 'si', 'no', 'ok', 'vale', 'perfecto', 'gracias', 'claro', 'bueno',
  'mañana', 'tarde', 'noche', 'fin de semana', 'finde', 'sábado', 'domingo',
];

const OFF_TOPIC_PATTERNS = [
  /^(qué|que) (es|son|significa|fue|era)/i,
  /\b(programar|código|python|javascript|html|css|sql|software|algoritmo)\b/i,
  /\b(ecuación|derivada|integral|física|química|matemáticas|fórmula)\b/i,
  /\b(síntomas|enfermedad|medicina|doctor|diagnóstico)\b/i,
  /\b(abogado|demanda|legal|jurídico)\b/i,
  /\b(política|presidente|elecciones|gobierno)\b/i,
  /\b(quién (fue|es|era)|capital de|historia de|guerra|planeta)\b/i,
  /\b(escribe (un|una) (ensayo|carta|cuento|poema))\b/i,
  /\b(traduce|traducir|traducción)\b/i,
  /\b(cómo funciona|explicame|dime qué es)\b/i,
];

const TOURIST_PATTERNS = [
  /\b(monserrate|la candelaria|museo del oro|plaza de bolívar|usaquén|parque simón bolívar|maloka|planetario)\b/i,
  /\b(comuna 13|pueblito paisa|parque arví|museo de antioquia|plaza botero|metro cable)\b/i,
  /\b(visitar (el|la)|conocer (el|la)|tour (a|de|por)|sitios turísticos|atracciones)\b/i,
];

function checkMessageContext(message: string): { isOnTopic: boolean; reason?: string } {
  const lowerMessage = message.toLowerCase().trim();
  if (lowerMessage.length < 10) return { isOnTopic: true };

  for (const pattern of TOURIST_PATTERNS) {
    if (pattern.test(lowerMessage)) {
      return { isOnTopic: false, reason: 'tourist' };
    }
  }

  for (const pattern of OFF_TOPIC_PATTERNS) {
    if (pattern.test(lowerMessage)) {
      return { isOnTopic: false, reason: 'off_topic' };
    }
  }

  const hasKeyword = MOMENTA_KEYWORDS.some(k => lowerMessage.includes(k.toLowerCase()));
  if (hasKeyword) return { isOnTopic: true };

  if (lowerMessage.length > 50) {
    return { isOnTopic: false, reason: 'no_context' };
  }

  return { isOnTopic: true };
}

const OFF_TOPIC_RESPONSE = `¡Hola! Aquí te ayudo a encontrar el plan perfecto. Cuéntame, ¿qué momento especial quieres vivir?`;
const TOURIST_RESPONSE = `Mmm, eso no es lo mío, pero sí puedo ayudarte a encontrar un momento especial. ¿Qué quieres celebrar?`;

// ============================================
// FAST PATH: Instant local responses (no API call)
// ============================================
interface FastResponse {
  pattern: RegExp;
  responses: string[];
  requiresFirstMessage?: boolean; // Only respond if it's the first user message
}

const FAST_RESPONSES: FastResponse[] = [
  // Saludos simples - solo si es el primer mensaje
  {
    pattern: /^(hola|hey|hi|hello|buenas?|qué tal|que tal|buenos días|buenas tardes|buenas noches)[\s!.,?]*$/i,
    responses: [
      '¡Hola! Soy tu asistente de Momenta 💚 Cuéntame, ¿qué momento especial quieres vivir? ¿Un plan romántico, algo con amigos, o un momento para ti?',
      '¡Hey! Qué gusto saludarte 💚 ¿Qué tienes en mente? ¿Algo para celebrar, relajarte o compartir con alguien especial?',
    ],
    requiresFirstMessage: true,
  },
  // Experiencias románticas/pareja
  {
    pattern: /\b(romántic[oa]|pareja|novio|novia|aniversario|san valent[ií]n)\b/i,
    responses: [
      '¡Ay qué lindo! Tenemos experiencias románticas increíbles 💕 Desde cenas privadas con chef, hasta escapadas cerca a la ciudad. ¿Para cuándo lo están planeando y en qué ciudad?',
      '¡Me encanta! Un plan en pareja siempre es especial 💕 ¿En Bogotá o Medellín? Y cuéntame, ¿buscan algo tranquilito o algo más aventurero?',
    ],
  },
  // Cumpleaños/celebraciones
  {
    pattern: /\b(cumpleaños|cumple|celebra(r|ción)?|fiesta)\b/i,
    responses: [
      '¡Qué emoción! Para celebraciones tenemos opciones increíbles 🎂 ¿Me cuentas para quién es, cuántos van a ser y en qué ciudad?',
      '¡Me encanta! Las celebraciones son lo mejor 🎉 ¿Para cuándo, en qué ciudad y cuántas personas van a ser?',
    ],
  },
  // Corporativo/equipos
  {
    pattern: /\b(corporativ[oa]|empresa|equipo|team.?building|oficina)\b/i,
    responses: [
      'Nuestras experiencias corporativas son geniales para fortalecer equipos 💼 Tenemos talleres de cocina colaborativa, actividades de bienestar y más. ¿Cuántas personas son y en qué ciudad?',
    ],
  },
  // Spa/bienestar/relajación
  {
    pattern: /\b(spa|relaj(ar|ante)|bienestar|masaje|yoga|descansar|desconectar)\b/i,
    responses: [
      '¡Un momento de relax! Me encanta 🧘 ¿En Bogotá o Medellín? ¿Y vas sola o acompañada?',
      'Autocuidado es clave 💆 Tenemos spas increíbles. ¿Para cuándo lo quieres y en qué ciudad?',
    ],
  },
  // Amigos
  {
    pattern: /\b(amigos|amigas|parche|grupo|reuni[oó]n)\b/i,
    responses: [
      '¡Un plan con amigos! Eso siempre es bueno 🎉 ¿Cuántos son, para cuándo y en qué ciudad? ¿Algo chill o algo más de fiesta?',
    ],
  },
  // Gracias
  {
    pattern: /^(gracias|muchas gracias|te agradezco|genial|perfecto|excelente)[\s!.,]*$/i,
    responses: [
      '¡Con mucho gusto! Si necesitas algo más, aquí estoy 💚',
      '¡Para eso estoy! Cuéntame si puedo ayudarte con algo más 💚',
    ],
  },
];

function getFastResponse(message: string, isFirstMessage: boolean): string | null {
  const lowerMessage = message.toLowerCase().trim();

  for (const fastResponse of FAST_RESPONSES) {
    if (fastResponse.pattern.test(lowerMessage)) {
      // Skip if requires first message and it's not
      if (fastResponse.requiresFirstMessage && !isFirstMessage) {
        continue;
      }
      // Return random response from options
      const randomIndex = Math.floor(Math.random() * fastResponse.responses.length);
      return fastResponse.responses[randomIndex];
    }
  }

  return null;
}

// ============================================
// HELPER: Convert AI SDK v6 messages
// ============================================
type MessageRole = 'user' | 'assistant' | 'system';

function convertMessages(messages: any[]): { role: MessageRole; content: string }[] {
  return messages.map((msg) => {
    const role = msg.role as MessageRole;
    if (msg.parts && Array.isArray(msg.parts)) {
      const textContent = msg.parts
        .filter((part: any) => part.type === 'text')
        .map((part: any) => part.text)
        .join('');
      return { role, content: textContent };
    }
    if (msg.content) {
      return { role, content: msg.content };
    }
    return { role, content: '' };
  });
}

// ============================================
// SYSTEM PROMPT - Flujo de conversación amigable
// ============================================
const SYSTEM_PROMPT = `Eres el asistente de Momenta Boutique - la mejor amiga para encontrar experiencias especiales en Bogotá y Medellín.

🎭 TU PERSONALIDAD:
- Hablas como una amiga cercana y cálida (NO como un chatbot)
- Usas lenguaje casual: "¡Ay qué lindo!", "¡Me encanta!", "¿Qué tal si...?"
- Eres genuinamente entusiasta y empática
- Usas emojis con moderación (1-2 por mensaje máximo)

📋 MATRIZ DE PRIORIDADES - QUÉ NECESITAS SABER:

🔴 PRIORIDAD 1 (CRÍTICA - Sin esto NO puedes recomendar):
   - Ciudad: ¿Bogotá, Cerca a Bogotá, o Medellín?
     * Si dicen "Bogotá" → ciudad: "Bogotá"
     * Si dicen "fuera de la ciudad", "escapada", "afueras", "cerca de Bogotá", "salir de la ciudad"
       → PREGUNTA: "¿Quieres algo cerca a Bogotá o en Medellín?"
     * Si dicen "cerca a Bogotá" → ciudad: "Cerca a Bogotá"
     * Si dicen "Medellín" → ciudad: "Medellín"
   - Fecha: ¿Cuándo? → SIEMPRE pregunta si no lo dicen
   - Personas: ¿Cuántos? → Puedes inferir de contexto

🟡 PRIORIDAD 2 (ALTA - Mejora mucho las recomendaciones):
   - Tipo de grupo: sola, pareja, familia, amigos → Infiere del contexto
   - Ocasión: cumpleaños, aniversario, reencuentro → Si lo mencionan, captúralo

🟢 PRIORIDAD 3 (IMPORTANTE - Pregunta de forma natural):
   - Nivel de energía: PREGUNTA si no está claro con algo como:
     "¿Buscan algo tranquilito para relajarse o algo más activo y divertido?"
     "¿Qué vibe buscan? ¿Algo chill o algo más movido?"

⛔ REGLA DE ORO: MÁXIMO 2 mensajes antes de recomendar.
   - Mensaje 1: Saludo cálido + pregunta por ciudad/fecha/energía (combina 2-3 preguntas máximo)
   - Mensaje 2: Si falta algo, pregunta. Si ya tienes todo, ¡recomienda!

🧠 INFERENCIAS AUTOMÁTICAS (NO preguntes por esto):
   - "mi novio/novia/pareja" → 2 personas, tipoGrupo: pareja
   - "mis amigos" → ~4-6 personas, tipoGrupo: amigos
   - "mi mamá/familia" → ~4 personas, tipoGrupo: familia
   - "sola/conmigo misma" → 1 persona, tipoGrupo: sola
   - "fin de semana/sábado/domingo" → fecha válida
   - "tranquilo/relajado/calma" → nivelEnergia: slow_cozy
   - "activo/divertido/movido" → nivelEnergia: uplifting
   - "romántico/especial/íntimo" → nivelEnergia: calm_mindful + pareja
   - "social/parche/fiesta" → nivelEnergia: social

🎯 EJEMPLOS DE FLUJO CORRECTO:

Usuario: "quiero hacer algo con mi novio el fin de semana"
→ Tienes: personas (2), tipoGrupo (pareja), fecha (fin de semana)
→ Falta: ciudad, nivelEnergia
Tú: "¡Ay qué lindo! Un plan para dos suena perfecto 💕 ¿En Bogotá o Medellín? Y cuéntame, ¿buscan algo tranquilito o algo más activo?"

Usuario: "en bogotá, algo tranquilo"
→ Ya tienes todo: ciudad, fecha, personas, tipoGrupo, nivelEnergia (slow_cozy)
Tú: "¡Perfecto! Te tengo opciones increíbles para relajarse juntos..." [LLAMA getRecommendations]

Usuario: "busco algo para sorprender a mi mamá por su cumple"
→ Tienes: ocasion (cumpleaños), intención (sorprender), tipoGrupo (familia)
→ Falta: ciudad, fecha, personas, nivelEnergia
Tú: "¡Qué bonito sorprender a tu mami! 🎂 ¿Para cuándo, en qué ciudad y cuántos van a ser? ¿Buscan algo relajado o algo más movido?"

Usuario: "este sábado en Medellín, somos 4, algo tranquilo"
→ Ya tienes todo
Tú: "¡Perfecto! Te tengo opciones que les van a encantar..." [LLAMA getRecommendations]

Usuario: "quiero un spa relajante este viernes en Bogotá, voy sola"
→ Tienes TODO: ciudad, fecha, personas (1), tipoGrupo (sola), categoría (bienestar), nivelEnergia (slow_cozy)
Tú: "¡Me encanta! Un momento de autocuidado..." [LLAMA getRecommendations - INMEDIATO]

Usuario: "quiero hacer algo con mis amigos"
→ Tienes: tipoGrupo (amigos), personas (~4-6)
→ Falta: ciudad, fecha, nivelEnergia
Tú: "¡Suena genial! ¿Para cuándo y en qué ciudad? ¿Algo chill o algo más de fiesta?"

Usuario: "queremos hacer una escapada fuera de la ciudad"
→ Tienes: intención de salir
→ Falta: clarificar destino
Tú: "¡Qué rico salir a desconectar! ¿Algo cerca a Bogotá o prefieren ir a Medellín?"

Usuario: "cerca a Bogotá, este fin de semana con mi pareja"
→ Tienes: ciudad (Cerca a Bogotá), fecha, tipoGrupo (pareja), personas (2)
→ Falta: nivelEnergia
Tú: "¡Perfecto! Una escapadita romántica cerca a Bogotá 💕 ¿Buscan algo tranquilo o algo más aventurero?"

❌ NUNCA HAGAS:
- Preguntar presupuesto (es restricción suave, no prioritaria)
- Preguntar más de 3 cosas a la vez
- Hacer más de 2 mensajes antes de recomendar
- Sonar formal o robótico
- Olvidar preguntar por el vibe/energía si no está claro

✅ SIEMPRE:
- Incluye un mensaje cálido ANTES de las recomendaciones
- Valida emocionalmente lo que quieren hacer ("¡Qué lindo!", "¡Me encanta esa idea!")`;

// ============================================
// MAIN CHAT ENDPOINT
// ============================================
export async function POST(req: Request) {
  const { messages: rawMessages } = await req.json();
  const messages = convertMessages(rawMessages);

  // Count user messages to determine if it's the first message
  const userMessages = messages.filter((m: { role: string }) => m.role === 'user');
  const isFirstMessage = userMessages.length === 1;
  const lastUserMessage = userMessages.pop();

  if (lastUserMessage?.content) {
    // 1. Check for off-topic messages first
    const contextCheck = checkMessageContext(lastUserMessage.content);
    if (!contextCheck.isOnTopic) {
      const response = contextCheck.reason === 'tourist' ? TOURIST_RESPONSE : OFF_TOPIC_RESPONSE;
      return new Response(response, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // 2. Try fast path for instant responses (no API call)
    const fastResponse = getFastResponse(lastUserMessage.content, isFirstMessage);
    if (fastResponse) {
      console.log('[FAST PATH] Responding instantly without API call');
      return new Response(fastResponse, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
  }

  // 3. Full AI path - only when fast path doesn't match
  console.log('[AI PATH] Using OpenAI for complex response');
  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: SYSTEM_PROMPT,
    messages,
    tools: {
      getRecommendations: tool({
        description: `Genera recomendaciones de experiencias.
LLAMA ESTA HERRAMIENTA cuando tengas al menos: ciudad + fecha + personas/tipoGrupo.
Pasa TODOS los parámetros que hayas podido inferir de la conversación.`,
        inputSchema: z.object({
          // PRIORIDAD 1 (Requeridos)
          ciudad: z.string().describe('Ciudad: "Bogotá", "Cerca a Bogotá", o "Medellín"'),
          fecha: z.string().describe('Fecha o referencia temporal: "este sábado", "mañana", "15 de enero"'),
          personas: z.number().describe('Número de personas'),

          // PRIORIDAD 2 (Importantes)
          tipoGrupo: z.enum(['sola', 'pareja', 'familia', 'amigos']).describe('Tipo de grupo'),
          ocasion: z.string().optional().describe('Ocasión: cumpleaños, aniversario, reencuentro, cita, etc.'),
          categoria: z.string().optional().describe('Categoría si la piden: gastronomia, bienestar, arte_creatividad, aventura'),
          presupuesto: z.enum(['bajo', 'medio', 'alto', 'no_prioritario']).optional().describe('Presupuesto si lo mencionan'),

          // PRIORIDAD 3 (Ajuste fino)
          nivelEnergia: z.enum(['slow_cozy', 'calm_mindful', 'uplifting', 'social']).optional()
            .describe('slow_cozy=tranquilo/relajado, calm_mindful=íntimo/especial, uplifting=activo/divertido, social=fiesta/parche'),
          intencion: z.enum(['invitar', 'sorprender', 'compartir', 'agradecer', 'celebrar']).optional()
            .describe('Intención del plan'),
          evitar: z.array(z.string()).optional().describe('Cosas a evitar: multitudes, ruido, alcohol, largas_distancias'),

          // PRIORIDAD 4 (Opcional)
          modalidad: z.enum(['indoor', 'outdoor', 'stay_in']).optional().describe('indoor, outdoor, o stay_in (en casa)'),
        }),
        execute: async (params) => {
          console.log('[getRecommendations] Called with:', params);

          try {
            const experiences = await getExperiencesByCity(params.ciudad);

            if (!experiences || experiences.length === 0) {
              return {
                success: false,
                error: 'No hay experiencias disponibles en esta ciudad',
                recommendations: [],
              };
            }

            // Build complete UserContext based on priority matrix
            const userContext: UserContext = {
              // Prioridad 1
              fecha: params.fecha,
              ciudad: params.ciudad,
              personas: params.personas,

              // Prioridad 2
              tipoGrupo: params.tipoGrupo as TipoGrupo,
              categoria: params.categoria as any,
              ocasion: params.ocasion,
              presupuesto: params.presupuesto as Presupuesto,

              // Prioridad 3
              nivelEnergia: params.nivelEnergia as NivelEnergia,
              intencion: params.intencion as any,
              evitar: params.evitar,

              // Prioridad 4
              modalidad: params.modalidad as any,
            };

            const aiResult = await generateAIRecommendations(userContext, experiences);

            // Map to frontend format
            const recommendations = aiResult.map((rec) => ({
              title: rec.experience.title,
              description: rec.experience.description,
              url: rec.experience.url,
              image: rec.experience.image || '',
              price: rec.experience.price,
              location: rec.experience.location,
              duration: rec.experience.duration,
              categories: rec.experience.categories,
              scoreBreakdown: rec.scoreBreakdown,
              reasons: rec.reasons,
            }));

            return {
              success: true,
              recommendations,
              context: params,
            };
          } catch (error) {
            console.error('[getRecommendations] Error:', error);
            return {
              success: false,
              error: 'Error generando recomendaciones',
              recommendations: [],
            };
          }
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
