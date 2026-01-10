import { streamText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { generateAIRecommendations, preFilterByEnergy, preFilterByUserExclusions } from '@/lib/intelligence/ai-service';
import { getExperiencesByCity } from '@/lib/db/experiences';
import type { UserContext, TipoGrupo, NivelEnergia, Presupuesto } from '@/lib/intelligence/types';
import {
  extractAccumulatedContext,
  generateContextReminder,
  needsDateClarification,
  getDateClarificationQuestion,
} from '@/lib/intelligence/context-extractor';

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
  'mañana', 'tarde', 'noche', 'fin de semana', 'finde', 'sábado', 'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes',
  'team building', 'equipo', 'corporativo', 'empresa', 'trabajo',
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
  // Contenido inapropiado/sexual - bloquear inmediatamente
  {
    pattern: /\b(putas?|prostitutas?|escorts?|prepagos?|scorts?|sexo\s+pago|servicios?\s+sexuales?)\b/i,
    responses: [
      'Lo siento, pero no puedo ayudar con ese tipo de búsquedas. Estoy aquí para recomendarte experiencias de bienestar, gastronomía y planes especiales. ¿Te gustaría explorar alguna de esas opciones? 😊',
    ],
  },
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
    pattern: /\b(romántic[oa]|pareja|novio|novia|nobio|nobia|aniversario|san valent[ií]n)\b/i,
    responses: [
      '¡Ay qué lindo! Tenemos experiencias románticas increíbles 💕 ¿Para cuándo lo están planeando y en qué ciudad?',
      '¡Me encanta! Un plan en pareja siempre es especial 💕 ¿En Bogotá, Medellín, o cerca a la ciudad? ¿Y para cuándo?',
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
      '¡Un plan con amigos! Eso siempre es bueno 🎉 ¿Cuántos son, para cuándo y en qué ciudad?',
      '¡Me encanta! Planes con amigos son los mejores 🎉 ¿Cuántas personas, en qué ciudad y para cuándo?',
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

// Patrones que indican que el mensaje ya tiene contexto rico
const RICH_CONTEXT_PATTERNS = [
  /\b(fuera\s+de|cerca\s+(a|de)|afueras|escapada)\b/i,  // Indica ubicación
  /\b(en\s+)?(bogot[áa]|vogota|bog|medell[ií]n|mede)\b/i,        // Ciudad explícita (incluye abreviaturas)
  /\b((este|próximo|proximo|el)\s+)?(fin\s+de\s+semana|finde|sábado|sabado|savado|domingo|lunes|martes|miércoles|miercoles|jueves|viernes)\b/i, // Fecha
  /\b(hoy|mañana|manana)\b/i,                           // Fecha
  /\bsomos\s+\d+\b/i,                                   // Número de personas
  /\b\d+\s+personas?\b/i,                               // Número de personas
  /\b(tranquilo|tranquila|relajado|relajada|relajante|relax|chill|activo|activa|aventura|aventurero|divertido|divertida|diferente|fiesta|íntimo|intimo|íntima|intima|romántico|romantico|romántica|romantica|especial|chimba|bacano|chevere|chévere|genial)\b/i, // Mood/energía
];

function messageHasRichContext(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  let matchCount = 0;

  for (const pattern of RICH_CONTEXT_PATTERNS) {
    if (pattern.test(lowerMessage)) {
      matchCount++;
      // Si tiene 2+ elementos de contexto, es un mensaje rico
      if (matchCount >= 2) return true;
    }
  }
  return false;
}

function getFastResponse(message: string, isFirstMessage: boolean, userMessageCount: number): string | null {
  // CAMBIO IMPORTANTE: Fast path solo aplica en la primera interacción del usuario
  // Después de eso, siempre se usa el AI para mantener contexto de conversación
  if (userMessageCount > 1) {
    console.log('[FAST PATH] Skipping - not first interaction (message count:', userMessageCount, ')');
    return null;
  }

  const lowerMessage = message.toLowerCase().trim();

  // PRIMERO: Verificar contenido inapropiado ANTES de cualquier otra lógica
  // Estos patrones SIEMPRE deben bloquear, sin importar el contexto
  const BLOCKED_CONTENT_PATTERN = /\b(putas?|prostitutas?|escorts?|prepagos?|scorts?|sexo\s+pago|servicios?\s+sexuales?)\b/i;
  if (BLOCKED_CONTENT_PATTERN.test(lowerMessage)) {
    console.log('[FAST PATH] Blocking inappropriate content');
    return 'Lo siento, pero no puedo ayudar con ese tipo de búsquedas. Estoy aquí para recomendarte experiencias de bienestar, gastronomía y planes especiales. ¿Te gustaría explorar alguna de esas opciones? 😊';
  }

  // Si el mensaje ya tiene contexto rico (ciudad, fecha, mood, etc.),
  // NO usar fast path - el AI debe procesar todo el contexto
  if (messageHasRichContext(message)) {
    console.log('[FAST PATH] Skipping - message has rich context, needs AI processing');
    return null;
  }

  // Fast path SOLO para saludos simples sin contexto adicional
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
   - Fecha: ¿Cuándo? → SIEMPRE pregunta si no lo dicen
   - Personas: ¿Cuántos? → Puedes inferir de contexto

🟡 PRIORIDAD 2 (ALTA - Mejora mucho las recomendaciones):
   - Tipo de grupo: sola, pareja, familia, amigos → Infiere del contexto
   - Ocasión: cumpleaños, aniversario, reencuentro → Si lo mencionan, captúralo

🟢 PRIORIDAD 3 (IMPORTANTE - Pregunta de forma NATURAL):
   - Nivel de energía: Si no está claro, pregunta NATURALMENTE según contexto

⛔ REGLA DE ORO: MÁXIMO 2 mensajes antes de recomendar.

🎯 CÓMO PREGUNTAR MOOD/VIBE DE FORMA NATURAL:

❌ NUNCA HAGAS ESTO (lista de opciones explícita):
"¿Quieres algo tranquilo y relajante, algo romántico y especial, activo y divertido, o algo más social?"

✅ EN CAMBIO, PREGUNTA SEGÚN CONTEXTO:

→ Para PAREJA/romántico:
  "¿Buscan algo para consentirse juntos o algo más de aventura?"
  "¿Quieren relajarse o prefieren algo más dinámico?"

→ Para AMIGAS/amigos:
  "¿Plan chill o quieren algo más movido?"
  "¿Algo para ponerse al día tranquilas o con más acción?"

→ Para CUMPLEAÑOS:
  "¿Celebración tranquila e íntima o con más fiesta?"
  "¿Algo especial y relajado o con más ambiente?"

→ Para FAMILIA:
  "¿Algo tranquilo para compartir o prefieren algo más activo?"

→ GENÉRICO (si no encaja arriba):
  "¿Cómo se sienten? ¿Con ganas de relajarse o de algo más activo?"
  "¿Qué vibe buscan para ese día?"

LA CLAVE: Una pregunta corta y natural, NO una lista de opciones.

🧠 INFERENCIAS AUTOMÁTICAS - DICCIONARIO DE MOOD/ENERGÍA:
Cuando el usuario use estas palabras, INFIERE el nivel de energía automáticamente:

📍 slow_cozy (tranquilo, relajado):
   - Palabras: relax, relajante, chill, tranqui, zen, calma, paz, descansar,
     desconectar, spa, masaje, wellness, bienestar, autocuidado, meditación,
     consentirme, mimarse, bajar revoluciones, resetear, contemplativo,
     silencio, quieto, naturaleza, campo, sunset, atardecer

📍 calm_mindful (íntimo, especial, romántico):
   - Palabras: íntimo, romántico, especial, a solas, privado, exclusivo,
     solo nosotros, para dos, enamorados, luna de miel, velada, sensual,
     cena íntima, conexión, cercano, acogedor, cálido, personal

📍 uplifting (activo, divertido):
   - Palabras: aventura, emocionante, activo, diferente, loco, extremo,
     adrenalina, intenso, dinámico, energético, acción, deportivo,
     outdoor, senderismo, hiking, explorar, descubrir, memorable,
     épico, challenge, reto, desafío, divertido, entretenido, juegos

📍 social (fiesta, parche):
   - Palabras: fiesta, rumba, parche, celebración, parranda, juerga,
     ambiente, animado, movido, vacilón, gozadera, pachanga, farra,
     bailable, música, dj, happy hour, brindis, tragos, cocteles,
     networking, conocer gente

⚠️ REGLA CRÍTICA - NO REPETIR PREGUNTAS:
Si el usuario YA dio información en mensajes anteriores, NO la preguntes de nuevo.
Ejemplos:
- Si dijo "somos 4" → NO preguntes cuántos son
- Si dijo "en Bogotá" → NO preguntes la ciudad
- Si dijo "algo tranquilo" → NO preguntes el vibe
- Si dijo "mis amigas" → NO preguntes si es en grupo

📅 REGLA DE FECHAS ESPECIALES:
SOLO pregunta por la fecha cuando el usuario mencione un evento (cumpleaños, aniversario) SIN especificar cuándo quiere la experiencia.
- "¡Mi cumple es el 15!" → Pregunta: "¿Quieres la experiencia para el 15 o planeas celebrarlo otro día?"
- "Cumpleaños de mi novia el viernes que viene en Bogotá" → NO preguntes, la fecha YA está clara (viernes que viene)
- "Aniversario este sábado en Medellín" → NO preguntes, la fecha YA está clara (este sábado)

🧘 YOGA Y BIENESTAR - SON VERSÁTILES:
- Yoga/bienestar sirve para TODOS los grupos: sola, pareja, familia, amigos
- Yoga puede ser tranquilo (meditativo) O activo (dinámico con amigas)
- SIEMPRE sugiere yoga/spa como opción para planes de amigas

🚨 REGLA CRÍTICA - FLUJO DE 2 PASOS:

DATOS MÍNIMOS NECESARIOS:
- Ciudad (Bogotá, Cerca a Bogotá, o Medellín)
- Fecha (cualquier referencia temporal)
- Tipo de grupo (sola, pareja, familia, amigos)
- Nivel de energía (tranquilo, activo, social, íntimo/romántico)

⚡ PASO 1: Cuando tengas los 4 datos → LLAMA confirmSearch
- NO escribas texto, solo llama al tool
- El tool genera el mensaje con emojis automáticamente

⚡ PASO 2: Cuando el usuario CONFIRME → LLAMA getRecommendations
PALABRAS DE CONFIRMACIÓN (si el usuario dice alguna de estas, LLAMA getRecommendations):
- "sí", "si"
- "está bien", "esta bien"
- "perfecto", "perfecto así"
- "ok", "okay"
- "dale", "dale pues"
- "correcto", "así está bien"
- "confirmo", "confirmado"
- "busca", "búscame"
- "listo", "va"

⚠️ MUY IMPORTANTE - DETECCIÓN DE CONFIRMACIÓN:
Si el mensaje anterior del asistente fue un resumen con emojis (📍👥📅💫)
Y el usuario responde con una palabra de confirmación
→ DEBES llamar getRecommendations, NO confirmSearch

❌ ERROR COMÚN - NO HAGAS ESTO:
Usuario: "si esta bien asi"
Tú: [Llamas confirmSearch de nuevo] ← ESTO ESTÁ MAL

✅ CORRECTO:
Usuario: "si esta bien asi"
Tú: [Llamas getRecommendations] ← ESTO ESTÁ BIEN

REGLA SIMPLE:
- ¿Ya mostraste el resumen con emojis? → Espera confirmación
- ¿Usuario confirmó? → Llama getRecommendations (NO confirmSearch)
- ¿Usuario quiere ajustar? → Pregunta qué quiere cambiar`;

// Función para construir el prompt con contexto acumulado
function buildSystemPromptWithContext(accumulatedContext: string): string {
  if (!accumulatedContext) {
    return SYSTEM_PROMPT;
  }
  return SYSTEM_PROMPT + '\n\n' + accumulatedContext;
}

// ============================================
// HELPER: Detect and extract confirmSearch tool result from raw messages
// ============================================
interface ConfirmSearchData {
  found: boolean;
  params?: {
    ciudad?: string;
    fecha?: string;
    personas?: number;
    tipoGrupo?: string;
    ocasion?: string;
    nivelEnergia?: string;
  };
}

function findConfirmSearchResult(rawMessages: any[]): ConfirmSearchData {
  console.log('[DETECTION] Checking raw messages for confirmSearch. Message count:', rawMessages.length);

  for (const msg of rawMessages) {
    if (msg.role === 'assistant') {
      // Check for tool invocations in various formats
      const toolInvocations = msg.toolInvocations || msg.tool_invocations || [];

      for (const tool of toolInvocations) {
        if (tool.toolName === 'confirmSearch' && tool.state === 'result') {
          console.log('[DETECTION] ✅ Found confirmSearch tool result:', tool);
          // Extract params from the result summary
          const summary = tool.result?.summary;
          return {
            found: true,
            params: summary ? {
              ciudad: summary.ciudad,
              fecha: summary.fecha,
              personas: summary.personas,
              tipoGrupo: summary.tipoGrupo,
              ocasion: summary.ocasion,
              nivelEnergia: summary.nivelEnergia,
            } : undefined,
          };
        }
      }

      // Also check parts array (AI SDK v3 format)
      if (msg.parts && Array.isArray(msg.parts)) {
        for (const part of msg.parts) {
          if (part.type === 'tool-invocation' && part.toolInvocation?.toolName === 'confirmSearch') {
            console.log('[DETECTION] ✅ Found confirmSearch in parts (tool-invocation)');
            return { found: true };
          }
          if (part.type === 'tool-result' && part.toolName === 'confirmSearch') {
            console.log('[DETECTION] ✅ Found confirmSearch in parts (tool-result)');
            return { found: true };
          }
        }
      }

      // Also check content for the emoji pattern (backup)
      const content = msg.content || '';
      if (content.includes('📍') && content.includes('👥') && content.includes('📅')) {
        console.log('[DETECTION] ✅ Found confirmSearch emojis in content');
        return { found: true };
      }
    }
  }
  console.log('[DETECTION] ❌ No confirmSearch found');
  return { found: false };
}

function wasConfirmSearchShown(rawMessages: any[]): boolean {
  return findConfirmSearchResult(rawMessages).found;
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

  // Count user messages to determine if it's the first message
  const userMessages = messages.filter((m: { role: string }) => m.role === 'user');
  const userMessageCount = userMessages.length;
  const isFirstMessage = userMessageCount === 1;
  const lastUserMessage = userMessages[userMessages.length - 1];

  // Detect confirmSearch from RAW messages (before conversion strips tool invocations)
  const confirmSearchData = findConfirmSearchResult(rawMessages);
  const userConfirmed = lastUserMessage && isUserConfirmation(lastUserMessage.content);

  console.log('[DETECTION] confirmSearchShown:', confirmSearchData.found);
  console.log('[DETECTION] confirmSearchParams:', confirmSearchData.params);
  console.log('[DETECTION] userConfirmed:', userConfirmed);
  console.log('[DETECTION] lastUserMessage:', lastUserMessage?.content);

  // Extraer contexto acumulado de TODOS los mensajes del usuario
  const accumulatedContext = extractAccumulatedContext(messages);

  // Override with more reliable detection from raw messages
  accumulatedContext.confirmSearchWasShown = confirmSearchData.found;
  accumulatedContext.userConfirmed = userConfirmed;

  // Use confirmSearch params as backup if context extraction missed something
  if (confirmSearchData.params) {
    if (!accumulatedContext.ciudad && confirmSearchData.params.ciudad) {
      accumulatedContext.ciudad = confirmSearchData.params.ciudad;
      console.log('[BACKUP] Using ciudad from confirmSearch:', confirmSearchData.params.ciudad);
    }
    if (!accumulatedContext.fecha && confirmSearchData.params.fecha) {
      accumulatedContext.fecha = confirmSearchData.params.fecha;
      console.log('[BACKUP] Using fecha from confirmSearch:', confirmSearchData.params.fecha);
    }
    if (!accumulatedContext.tipoGrupo && confirmSearchData.params.tipoGrupo) {
      accumulatedContext.tipoGrupo = confirmSearchData.params.tipoGrupo as any;
      console.log('[BACKUP] Using tipoGrupo from confirmSearch:', confirmSearchData.params.tipoGrupo);
    }
    if (!accumulatedContext.nivelEnergia && confirmSearchData.params.nivelEnergia) {
      accumulatedContext.nivelEnergia = confirmSearchData.params.nivelEnergia as any;
      console.log('[BACKUP] Using nivelEnergia from confirmSearch:', confirmSearchData.params.nivelEnergia);
    }
    if (!accumulatedContext.personas && confirmSearchData.params.personas) {
      accumulatedContext.personas = confirmSearchData.params.personas;
      console.log('[BACKUP] Using personas from confirmSearch:', confirmSearchData.params.personas);
    }
    if (!accumulatedContext.ocasion && confirmSearchData.params.ocasion) {
      accumulatedContext.ocasion = confirmSearchData.params.ocasion;
      console.log('[BACKUP] Using ocasion from confirmSearch:', confirmSearchData.params.ocasion);
    }
  }

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

    // 3. Try fast path for simple greetings (SOLO en la primera interacción)
    const fastResponse = getFastResponse(lastUserMessage.content, isFirstMessage, userMessageCount);
    if (fastResponse) {
      console.log('[FAST PATH] Responding with delayed stream');
      return createDelayedStreamResponse(fastResponse);
    }
  }

  // 3. Full AI path - only when fast path doesn't match
  console.log('[AI PATH] Using OpenAI for complex response');

  // Construir el system prompt con el contexto acumulado
  const systemPromptWithContext = buildSystemPromptWithContext(contextReminder);

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: systemPromptWithContext,
    messages,
    tools: {
      // PASO 1: Tool de confirmación - muestra resumen antes de buscar
      confirmSearch: tool({
        description: `PASO 1: Muestra un resumen con bullets para que el usuario confirme antes de buscar.
LLAMA ESTA HERRAMIENTA cuando tengas los 4 datos: ciudad + fecha + tipoGrupo + nivelEnergia.
Después de que el usuario confirme, usa getRecommendations.`,
        inputSchema: z.object({
          ciudad: z.string().describe('Ciudad: "Bogotá", "Cerca a Bogotá", o "Medellín"'),
          fecha: z.string().describe('Fecha o referencia temporal'),
          personas: z.number().describe('Número de personas'),
          tipoGrupo: z.enum(['sola', 'pareja', 'familia', 'amigos']).describe('Tipo de grupo'),
          ocasion: z.string().optional().describe('Ocasión especial si la hay'),
          nivelEnergia: z.enum(['slow_cozy', 'calm_mindful', 'uplifting', 'social']).optional()
            .describe('Nivel de energía/vibe'),
        }),
        execute: async (params) => {
          console.log('[confirmSearch] Showing summary for confirmation:', params);

          const energiaTexto: Record<string, string> = {
            slow_cozy: 'Tranquilo/Relajado 🧘',
            calm_mindful: 'Íntimo/Romántico 💕',
            uplifting: 'Activo/Divertido 🎉',
            social: 'Social/Fiesta 🥳',
          };

          const grupoTexto: Record<string, string> = {
            sola: 'Plan individual',
            pareja: 'Plan en pareja',
            familia: 'Plan familiar',
            amigos: 'Plan con amigos',
          };

          return {
            confirmed: false,
            summary: {
              ciudad: params.ciudad,
              fecha: params.fecha,
              personas: params.personas,
              tipoGrupo: params.tipoGrupo,
              ocasion: params.ocasion,
              nivelEnergia: params.nivelEnergia,
            },
            displayMessage: `¡Perfecto! Déjame confirmar lo que busco:

📍 Ciudad: ${params.ciudad}
👥 Grupo: ${grupoTexto[params.tipoGrupo]} (${params.personas} persona${params.personas > 1 ? 's' : ''})
📅 Fecha: ${params.fecha}${params.ocasion ? `\n🎉 Ocasión: ${params.ocasion}` : ''}
💫 Vibe: ${params.nivelEnergia ? energiaTexto[params.nivelEnergia] : 'Flexible'}

¿Está bien así o quieres ajustar algo?`,
          };
        },
      }),

      // PASO 2: Tool de recomendaciones - busca en la base de datos
      getRecommendations: tool({
        description: `PASO 2: Busca experiencias en la base de datos.
SOLO usa esta herramienta DESPUÉS de que el usuario confirme con confirmSearch.
Si el usuario dice "sí", "dale", "perfecto", "ok", "está bien" → usa esta herramienta.`,
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
    },
  });

  return result.toUIMessageStreamResponse();
}
