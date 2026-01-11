import {
  extractAccumulatedContext
} from '@/lib/intelligence/context-extractor';
import { buildSystemPromptWithContext } from '@/lib/prompts';
import { openai } from '@ai-sdk/openai';
import { stepCountIs, streamText, convertToModelMessages } from 'ai';
import { getRecommendations, requestFeedback } from './tools';

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
// SYSTEM PROMPT - Now managed in modular files
// See: src/lib/prompts/
// ============================================
// The SYSTEM_PROMPT and buildSystemPromptWithContext are now imported from @/lib/prompts

// ============================================
// MAIN CHAT ENDPOINT
// ============================================
export async function POST(req: Request) {
  const { messages: rawMessages } = await req.json();
  const messages = await convertToModelMessages(rawMessages);

  // Get user messages for context
  const userMessages = messages.filter((m: { role: string }) => m.role === 'user');

  // Extraer contexto acumulado de TODOS los mensajes del usuario
  const accumulatedContext = extractAccumulatedContext(messages);

  // const contextReminder = generateContextReminder(accumulatedContext);

  // Construir el system prompt con el contexto acumulado
  const systemPromptWithContext = buildSystemPromptWithContext(accumulatedContext);

  let getRecommendationsWasCalled = false;
  let textAfterToolCall = false;

  // Track accumulated text to detect feedback transition message
  let accumulatedText = '';
  let feedbackTransitionDetected = false;
  let lastRecommendationIds: string[] = [];

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: systemPromptWithContext,
    messages,
    stopWhen: stepCountIs(5),
    // onStepFinish: ({ text, toolCalls }) => {
    //   console.log('[onStepFinish] text length:', text?.length || 0);
    //   if (toolCalls) {
    //     console.log('[onStepFinish] toolCalls:', toolCalls.map(tc => tc.toolName));
    //     // Track if getRecommendations was called
    //     if (toolCalls.some(tc => tc.toolName === 'getRecommendations')) {
    //       getRecommendationsWasCalled = true;
    //       console.log('[onStepFinish] ✅ getRecommendations detected');
    //     }
    //   }
    //   // Track if any text was output
    //   if (text && text.trim().length > 0) {
    //     textAfterToolCall = true;
    //     console.log('[onStepFinish] ✅ Text output detected');
    //   }
    // },

    tools: {
      // Get the experiencies from the database
      getRecommendations,

      // Request the user feedback about the recommended experiences
      requestFeedback,
    },
  });

  return result.toUIMessageStreamResponse();

  // // ============================================
  // // STREAM INTERCEPTOR: Auto-inject follow-up question after getRecommendations
  // // ============================================
  // // Intercept the stream and inject text BEFORE the finish event

  // const originalResponse = result.toUIMessageStreamResponse();

  // const encoder = new TextEncoder();
  // const decoder = new TextDecoder();

  // const transformedStream = originalResponse.body?.pipeThrough(
  //   new TransformStream({
  //     transform: async (chunk, controller) => {
  //       const chunkText = decoder.decode(chunk, { stream: true });

  //       // Accumulate text to detect feedback transition message
  //       if (chunkText.includes('"type":"text-delta"')) {
  //         try {
  //           const lines = chunkText.split('\n');
  //           for (const line of lines) {
  //             if (line.startsWith('data: ')) {
  //               const json = JSON.parse(line.substring(6));
  //               if (json.type === 'text-delta' && json.delta) {
  //                 accumulatedText += json.delta;
  //               }
  //             }
  //           }
  //         } catch (e) {
  //           // Ignore JSON parse errors
  //         }
  //       }

  //       // Capture recommendation IDs from getRecommendations tool results
  //       if (chunkText.includes('"type":"tool-result"') || chunkText.includes('"type":"tool-output-available"')) {
  //         console.log('[TRANSFORM] Detected tool result chunk');
  //         try {
  //           const lines = chunkText.split('\n');
  //           for (const line of lines) {
  //             if (line.startsWith('data: ')) {
  //               const json = JSON.parse(line.substring(6));
  //               console.log('[TRANSFORM] Tool result event:', { type: json.type, hasOutput: !!json.output, hasResult: !!json.result });

  //               // Check both json.output and json.result (AI SDK may use either)
  //               const toolData = json.output || json.result;

  //               if ((json.type === 'tool-result' || json.type === 'tool-output-available') &&
  //                 toolData?.success &&
  //                 toolData?.recommendations) {
  //                 // Extract URLs from recommendations
  //                 lastRecommendationIds = toolData.recommendations.map((rec: any) => rec.url);
  //                 console.log('[TRANSFORM] ✅ Captured recommendation IDs:', lastRecommendationIds);
  //               }
  //             }
  //           }
  //         } catch (e) {
  //           console.error('[TRANSFORM] Error parsing tool result:', e);
  //         }
  //       }

  //       // Check if this chunk contains the finish event
  //       if (chunkText.includes('"type":"finish"')) {
  //         console.log('[TRANSFORM] Detected finish event');

  //         // INTERCEPTOR 1: If getRecommendations was called but no text followed, inject question
  //         if (getRecommendationsWasCalled && !textAfterToolCall) {
  //           console.log('[TRANSFORM] 💉 Injecting follow-up question BEFORE finish event');

  //           const followUpQuestion = 'Pudiste revisar las experiencias - cuál te gustó mas?';
  //           const textDeltaEvent = 'data: ' + JSON.stringify({
  //             type: 'text-delta',
  //             delta: followUpQuestion
  //           }) + '\n\n';

  //           controller.enqueue(encoder.encode(textDeltaEvent));
  //         }

  //         // INTERCEPTOR 2: If feedback transition message was detected, inject feedback form trigger
  //         const feedbackTriggerPhrases = [
  //           'Antes de finalizar la reserva',
  //           'me ayudarías con estos datos',
  //           'formalizar tu participación en el giveaway'
  //         ];

  //         const hasFeedbackTrigger = feedbackTriggerPhrases.some(phrase =>
  //           accumulatedText.toLowerCase().includes(phrase.toLowerCase())
  //         );

  //         if (hasFeedbackTrigger && !feedbackTransitionDetected) {
  //           feedbackTransitionDetected = true;
  //           console.log('[TRANSFORM] 💉 Detected feedback transition message, injecting feedback form trigger');
  //           console.log('[TRANSFORM] Using recommendation IDs:', lastRecommendationIds);

  //           // Inject custom event to trigger feedback form
  //           const feedbackFormEvent = 'data: ' + JSON.stringify({
  //             type: 'show-feedback-form',
  //             userSentiment: accumulatedText.toLowerCase().includes('me encanta') ||
  //               accumulatedText.toLowerCase().includes('perfecto') ? 'positive' :
  //               accumulatedText.toLowerCase().includes('no me convence') ||
  //                 accumulatedText.toLowerCase().includes('ninguna') ? 'negative' : 'neutral',
  //             contextMessage: accumulatedText.substring(Math.max(0, accumulatedText.length - 200)),
  //             recommendationIds: lastRecommendationIds
  //           }) + '\n\n';

  //           controller.enqueue(encoder.encode(feedbackFormEvent));
  //         }
  //       }

  //       // Pass through the original chunk
  //       controller.enqueue(chunk);
  //     }
  //   })
  // );

  // return new Response(transformedStream, {
  //   headers: originalResponse.headers,
  // });
}
