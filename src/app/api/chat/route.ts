import { getExperiencesByCity } from '@/lib/db/experiences';
import { generateAIRecommendations, preFilterByEnergy, preFilterByUserExclusions } from '@/lib/intelligence/ai-service';
import {
  extractAccumulatedContext,
  generateContextReminder
} from '@/lib/intelligence/context-extractor';
import type { NivelEnergia, Presupuesto, TipoGrupo, UserContext } from '@/lib/intelligence/types';
import { buildSystemPromptWithContext } from '@/lib/prompts';
import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';

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
  'bogotá', 'ciudad', 'cerca', 'escapada', 'afueras', 'fuera de la ciudad',
  'restaurante', 'comida', 'spa', 'bienestar', 'arte',
  'busco', 'quiero', 'necesito', 'me gustaría', 'ayuda',
  'qué', 'cuál', 'cómo', 'dónde', 'cuándo',
  'momenta', 'boutique',
  'sí', 'si', 'no', 'ok', 'vale', 'perfecto', 'gracias', 'claro', 'bueno',
  'mañana', 'tarde', 'noche', 'fin de semana', 'finde', 'sábado', 'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes',
  'team building', 'equipo', 'corporativo', 'empresa', 'trabajo',
  // Feedback keywords - allow user responses about recommendations
  'gusta', 'gustan', 'gustó', 'gustaron', 'encanta', 'encantan', 'encantó', 'encantaron',
  'me parece', 'parece', 'parecen', 'interesa', 'interesan', 'interesante',
  'primera', 'segunda', 'tercera', 'opción', 'opciones', 'recomendación', 'recomendaciones',
  'mejor', 'perfecto', 'perfecto', 'ideal', 'genial', 'increíble', 'excelente',
  'no me', 'ninguna', 'otra', 'diferente', 'algo más', 'ver más',
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

  // Check for tourist-specific queries
  for (const pattern of TOURIST_PATTERNS) {
    if (pattern.test(lowerMessage)) {
      return { isOnTopic: false, reason: 'tourist' };
    }
  }

  // Check for clearly off-topic patterns
  for (const pattern of OFF_TOPIC_PATTERNS) {
    if (pattern.test(lowerMessage)) {
      return { isOnTopic: false, reason: 'off_topic' };
    }
  }

  // Check for Momenta keywords
  const hasKeyword = MOMENTA_KEYWORDS.some(k => lowerMessage.includes(k.toLowerCase()));
  if (hasKeyword) return { isOnTopic: true };

  // Only reject very long messages without any Momenta context (increased threshold from 50 to 100)
  // This allows for more natural feedback and conversation
  if (lowerMessage.length > 100) {
    return { isOnTopic: false, reason: 'no_context' };
  }

  return { isOnTopic: true };
}

const OFF_TOPIC_RESPONSE = `¡Hola! Aquí te ayudo a encontrar el plan perfecto. Cuéntame, ¿qué momento especial quieres vivir?`;
const TOURIST_RESPONSE = `Mmm, eso no es lo mío, pero sí puedo ayudarte a encontrar un momento especial. ¿Qué quieres celebrar?`;

// ============================================
// HELPER: Stream text with delay (más natural)
// ============================================
async function* streamWithDelay(text: string): AsyncGenerator<string> {
  const words = text.split(' ');
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    yield word + (i < words.length - 1 ? ' ' : '');
    // Delay variable entre 25-50ms por palabra para parecer más natural
    await new Promise(r => setTimeout(r, 25 + Math.random() * 25));
  }
}

function createDelayedStreamResponse(text: string): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of streamWithDelay(text)) {
        // Formato compatible con el frontend: texto plano
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  });
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
// SYSTEM PROMPT - Now managed in modular files
// See: src/lib/prompts/
// ============================================
// The SYSTEM_PROMPT and buildSystemPromptWithContext are now imported from @/lib/prompts

// ============================================
// HELPER: Detect confirmation message with emojis (📍👥📅)
// ============================================
function wasConfirmationShown(rawMessages: any[]): boolean {
  for (const msg of rawMessages) {
    if (msg.role === 'assistant') {
      // Check content for the emoji pattern
      const content = msg.content || '';
      if (content.includes('📍') && content.includes('👥') && content.includes('📅')) {
        console.log('[DETECTION] ✅ Found confirmation message with emojis');
        return true;
      }

      // Also check parts array for text content
      if (msg.parts && Array.isArray(msg.parts)) {
        for (const part of msg.parts) {
          if (part.type === 'text' && part.text) {
            if (part.text.includes('📍') && part.text.includes('👥') && part.text.includes('📅')) {
              console.log('[DETECTION] ✅ Found confirmation emojis in parts');
              return true;
            }
          }
        }
      }
    }
  }
  return false;
}

// Alias for backwards compatibility
function wasConfirmSearchShown(rawMessages: any[]): boolean {
  return wasConfirmationShown(rawMessages);
}

// ============================================
// HELPER: Check if last user message is confirmation
// ============================================
const CONFIRMATION_PATTERNS_ROUTE = [
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
  /^s[ií]\s+perfecto/i,      // "si perfecto", "sí perfecto"
  /^s[ií],?\s*(dale|listo|va|claro|eso|busca|genial)/i, // "si, dale", "si listo", etc.
  /^bien$/i,
  /^sip$/i,
  /^claro/i,
  /^seguro/i,
  /^por\s*supuesto/i,
  /^eso\s*(es|esta)/i,
  /^exacto/i,
  /^así\s*mismo/i,
  /^adelante/i,
  /^genial/i,                // "genial" como confirmación
  /^súper/i,                 // "súper", "super"
  /^excelente/i,             // "excelente"
];

function isUserConfirmation(message: string): boolean {
  const clean = message.toLowerCase().trim();
  return CONFIRMATION_PATTERNS_ROUTE.some(p => p.test(clean));
}

// ============================================
// MAIN CHAT ENDPOINT
// ============================================
export async function POST(req: Request) {
  const { messages: rawMessages } = await req.json();
  const messages = convertMessages(rawMessages);

  // Get user messages for context
  const userMessages = messages.filter((m: { role: string }) => m.role === 'user');
  const lastUserMessage = userMessages[userMessages.length - 1];

  // Detect if confirmation message was shown (message with emojis 📍👥📅)
  const confirmationWasShown = wasConfirmationShown(rawMessages);
  const userConfirmed = lastUserMessage && isUserConfirmation(lastUserMessage.content);

  console.log('[DETECTION] confirmationWasShown:', confirmationWasShown);
  console.log('[DETECTION] userConfirmed:', userConfirmed);
  console.log('[DETECTION] lastUserMessage:', lastUserMessage?.content);

  // Extraer contexto acumulado de TODOS los mensajes del usuario
  const accumulatedContext = extractAccumulatedContext(messages);

  // Track confirmation state
  accumulatedContext.confirmSearchWasShown = confirmationWasShown;
  accumulatedContext.userConfirmed = userConfirmed;

  const contextReminder = generateContextReminder(accumulatedContext);

  console.log('[CONTEXT] Accumulated context:', accumulatedContext);

  if (lastUserMessage?.content) {
    // 1. Check for off-topic messages first
    const contextCheck = checkMessageContext(lastUserMessage.content);
    if (!contextCheck.isOnTopic) {
      const response = contextCheck.reason === 'tourist' ? TOURIST_RESPONSE : OFF_TOPIC_RESPONSE;
      return createDelayedStreamResponse(response);
    }

    // 2. FAST PATH: Si el usuario confirmó y tenemos todos los datos, ir directo a getRecommendations
    if (accumulatedContext.userConfirmed && accumulatedContext.confirmSearchWasShown) {
      console.log('[CONFIRMATION FAST PATH] ✅ User confirmed AND confirmSearch was shown');
      console.log('[CONFIRMATION FAST PATH] Context:', {
        ciudad: accumulatedContext.ciudad,
        fecha: accumulatedContext.fecha,
        tipoGrupo: accumulatedContext.tipoGrupo,
        nivelEnergia: accumulatedContext.nivelEnergia,
        personas: accumulatedContext.personas,
      });

      const hasAllData = accumulatedContext.ciudad && accumulatedContext.fecha &&
        accumulatedContext.tipoGrupo;

      // nivelEnergia can be optional - default to calm_mindful for pareja, uplifting for others
      const nivelEnergia = accumulatedContext.nivelEnergia ||
        (accumulatedContext.tipoGrupo === 'pareja' ? 'calm_mindful' : 'uplifting');

      if (hasAllData) {
        console.log('[CONFIRMATION FAST PATH] ✅ Has all required data, executing getRecommendations');
        try {
          const rawExperiences = await getExperiencesByCity(accumulatedContext.ciudad!);
          // PRE-FILTER 1: Remove experiences that contradict energy level
          let experiences = preFilterByEnergy(rawExperiences, nivelEnergia);
          console.log(`[CONFIRMATION FAST PATH] Energy pre-filter: ${rawExperiences.length} → ${experiences.length} experiences`);

          // PRE-FILTER 2: Remove experiences the user explicitly wants to avoid
          if (accumulatedContext.evitar && accumulatedContext.evitar.length > 0) {
            const beforeUserFilter = experiences.length;
            experiences = preFilterByUserExclusions(experiences, accumulatedContext.evitar);
            console.log(`[CONFIRMATION FAST PATH] User exclusion pre-filter: ${beforeUserFilter} → ${experiences.length} experiences (evitar: ${accumulatedContext.evitar.join(', ')})`);
          }

          if (experiences && experiences.length > 0) {
            const personas = accumulatedContext.personas ||
              (accumulatedContext.tipoGrupo === 'pareja' ? 2 :
                accumulatedContext.tipoGrupo === 'sola' ? 1 : 5);

            const userContext: UserContext = {
              fecha: accumulatedContext.fecha!,
              ciudad: accumulatedContext.ciudad!,
              personas,
              tipoGrupo: accumulatedContext.tipoGrupo!,
              nivelEnergia: nivelEnergia as any,
              ocasion: accumulatedContext.ocasion,
              evitar: accumulatedContext.evitar,
            };
            console.log('[CONFIRMATION FAST PATH] UserContext:', userContext);

            const aiResult = await generateAIRecommendations(userContext, experiences);

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

            // Crear respuesta con tool result para que el frontend muestre las cards
            const toolResult = {
              success: true,
              recommendations,
              context: userContext,
            };

            // Stream response con el tool call + result en formato AI SDK
            const toolCallId = 'direct-recommendation-' + Date.now();
            const encoder = new TextEncoder();

            const stream = new ReadableStream({
              async start(controller) {
                // 1. Send tool call start (9: prefix - AI SDK format)
                const toolCall = {
                  toolCallId: toolCallId,
                  toolName: 'getRecommendations',
                  args: userContext,
                };
                controller.enqueue(encoder.encode('9:' + JSON.stringify(toolCall) + '\n'));
                await new Promise(r => setTimeout(r, 50));

                // 2. Send tool result (a: prefix - AI SDK format)
                const toolResultPayload = {
                  toolCallId: toolCallId,
                  result: toolResult,
                };
                controller.enqueue(encoder.encode('a:' + JSON.stringify(toolResultPayload) + '\n'));
                await new Promise(r => setTimeout(r, 50));

                // 3. Send text response
                const responseText = `¡Encontré estas opciones perfectas para ti! 💕`;
                controller.enqueue(encoder.encode('0:' + JSON.stringify(responseText) + '\n'));

                controller.close();
              },
            });

            return new Response(stream, {
              headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked',
              },
            });
          }
        } catch (error) {
          console.error('[CONFIRMATION FAST PATH] Error:', error);
          // Fall through to AI path
        }
      } else {
        console.log('[CONFIRMATION FAST PATH] ❌ Missing required data:', {
          ciudad: !!accumulatedContext.ciudad,
          fecha: !!accumulatedContext.fecha,
          tipoGrupo: !!accumulatedContext.tipoGrupo,
        });
      }
    } else {
      console.log('[CONFIRMATION FAST PATH] ❌ Conditions not met:', {
        userConfirmed: accumulatedContext.userConfirmed,
        confirmSearchWasShown: accumulatedContext.confirmSearchWasShown,
      });
    }
  }

  // Full AI path - La IA maneja TODO (incluyendo contenido inapropiado)
  console.log('[AI PATH] Using OpenAI for complex response');

  // Construir el system prompt con el contexto acumulado
  const systemPromptWithContext = buildSystemPromptWithContext(contextReminder);

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: systemPromptWithContext,
    messages,
    tools: {
      // Tool de recomendaciones - busca en la base de datos
      getRecommendations: tool({
        description: `
          Busca experiencias en la base de datos según los criterios del usuario.

          CUÁNDO USAR:
          - Usuario confirmó el resumen que mostraste (dice "sí", "dale", "perfecto", "ok")
          - O tienes toda la información necesaria (ciudad + fecha como mínimo)

          DESPUÉS DE LLAMAR: Pregunta por la opinión del usuario.
          "¿Te gustó alguna de estas opciones?" o "¿Qué te parecieron?"
        `,
        inputSchema: z.object({
          // PRIORIDAD 1 (Requeridos)
          ciudad: z.string().describe('Ciudad: "Bogotá" o "Cerca de Bogotá"'),
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
            const rawExperiences = await getExperiencesByCity(params.ciudad);
            // PRE-FILTER 1: Remove experiences that contradict energy level
            let experiences = preFilterByEnergy(rawExperiences, params.nivelEnergia);
            console.log(`[getRecommendations] Energy pre-filter: ${rawExperiences.length} → ${experiences.length} experiences`);

            // PRE-FILTER 2: Remove experiences the user explicitly wants to avoid
            if (params.evitar && params.evitar.length > 0) {
              const beforeUserFilter = experiences.length;
              experiences = preFilterByUserExclusions(experiences, params.evitar);
              console.log(`[getRecommendations] User exclusion pre-filter: ${beforeUserFilter} → ${experiences.length} experiences (evitar: ${params.evitar.join(', ')})`);
            }

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

      // PASO 3: Pide feedback
      requestFeedback: tool({
        description: `
          Solicita feedback del usuario sobre las recomendaciones mostradas.
          Usa esta herramienta DESPUÉS de que el usuario haya expresado interés (positivo o negativo) en las recomendaciones. El objetivo es recopilar su email para el sorteo y su opinión general.

          Contexto de uso:
          - Usuario dice "me gustó X" o "no me convence" → llama esta herramienta
          - Incluye un mensaje cálido explicando que es para el sorteo"
        `,
        inputSchema: z.object({
          contextMessage: z.string().describe(
            'Mensaje contextual que se mostrará antes del formulario. ' +
            'Debe ser cálido y explicar que es para formalizar participación en sorteo.'
          ),
          recommendationContext: z.object({
            recommendationIds: z.array(z.string()).describe('URLs de las recomendaciones mostradas'),
            userSentiment: z.enum(['positive', 'negative']).describe(
              'Sentimiento del usuario hacia las recomendaciones basado en su respuesta'
            )
          }).optional()
        }),
        execute: async ({ contextMessage, recommendationContext }) => {
          console.log('[requestFeedback] Called with:', { contextMessage, recommendationContext });

          // This tool doesn't need to do anything server-side
          // It just signals to the frontend to show the feedback form
          return {
            success: true,
            message: contextMessage,
            showFeedbackForm: true,
            context: recommendationContext || null
          };
        }
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
