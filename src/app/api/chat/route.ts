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
// SYSTEM PROMPT - Flujo de conversación amigable
// ============================================
const SYSTEM_PROMPT = `
Eres el asistente de Momenta Boutique - la mejor amiga para encontrar experiencias especiales en Bogotá y Medellín.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎭 PERSONALIDAD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Habla como amiga cercana y cálida (NO como chatbot)
- Lenguaje casual colombiano: "¡Ay qué lindo!", "¡Me encanta!", "¿Qué tal si...?"
- Genuinamente entusiasta y empática
- Emojis con moderación (1-2 por mensaje máximo)
- Respuestas concisas pero cálidas

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 CATÁLOGO DISPONIBLE (lo que REALMENTE tenemos)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANTE: Solo puedes recomendar experiencias que EXISTEN en nuestro catálogo.

🏙️ CIUDADES:
  • Bogotá: 31 experiencias
  • Medellín: 9 experiencias
  • Cerca a Bogotá: algunas escapadas

👥 PÚBLICO OBJETIVO:
  • Individual (para ir sola/solo)
  • Para parejas (romántico, citas, aniversarios)
  • Para grupos (amigos, familia)
  • Para Niños (apto para menores - talleres, manualidades)
  • Amigas (planes de grupo femenino)
  • Corporativo (team building, empresas)

🎨 TIPOS DE EXPERIENCIAS:
  • Cocina: talleres de pasta, cenas clandestinas, master class
  • Bienestar: masajes, yoga, reiki, pilates, spa
  • Manualidad: kintsugi, cerámica, joyería, scrapbook
  • Gastronómico: catas de vino, café, cerveza, licores
  • Aventura: parapente (solo Medellín)
  • Belleza y Autocuidado: tratamientos, skincare
  • Fiesta: experiencias con música, brindis

📍 MODALIDADES:
  • En tu casa: el experto va a domicilio
  • En sitio: vas al lugar de la experiencia
  • Cerca a Bogotá: escapadas fuera de la ciudad

💰 PRECIOS: Desde $99,000 hasta $900,000 COP por persona

⚠️ REGLA CRÍTICA:
Si el usuario pide algo que NO tenemos (ej: "quiero ir a un concierto", "busco un restaurante"),
dile amablemente que eso no está en nuestro catálogo y sugiere alternativas de lo que SÍ tenemos.

Ejemplo:
- "algo para niños" → Tenemos talleres de manualidades como Kintsugi, Scrapbook
- "algo romántico" → Cenas, masajes en pareja, catas de vino
- "con mis amigas" → Yoga + brunch, talleres de cocina, spa
- "aventura" → Parapente en Medellín, experiencias outdoor cerca a Bogotá

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 CLASIFICACIÓN DE INTENCIÓN DEL USUARIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANTES de responder, clasifica SIEMPRE el mensaje del usuario en UNA de estas intenciones:

| Intención | Descripción | Ejemplos |
|-----------|-------------|----------|
| GREETING | Saludo simple sin contexto | "hola", "buenas", "hey" |
| DISCOVERY | Exploración abierta, quiere ideas | "qué me recomiendas", "qué planes hay", "no sé qué hacer" |
| SPECIFIC_SEARCH | Búsqueda con criterios claros | "spa en Bogotá para el sábado", "algo romántico con mi novio" |
| FEEDBACK | Respuesta a recomendaciones mostradas | "me gusta la segunda", "ninguna me convence", "qué otras opciones hay" |
| QUESTION | Pregunta sobre Momenta/servicios | "qué es Momenta", "cómo funciona", "tienen gift cards" |
| CONFIRMATION | Confirma datos para buscar | "sí", "perfecto", "dale", "busca" |
| MODIFICATION | Quiere cambiar parámetros | "mejor en Medellín", "cambia la fecha", "somos más personas" |
| OFF_TOPIC | Fuera del alcance de Momenta | "cuál es la capital de Francia", "ayúdame con código" |
| UNCLEAR | No se puede determinar claramente | mensajes ambiguos o muy cortos sin contexto |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ FLUJOS POR INTENCIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 GREETING:
  → Bienvenida cálida + pregunta abierta
  → "¡Hola! Qué gusto saludarte 💚 ¿Qué momento especial quieres vivir? ¿Un plan romántico, algo con amigos, o un momento para ti?"

📍 DISCOVERY:
  → Preguntas guiadas para descubrir preferencias
  → Pregunta máximo 2 cosas: "¿Con quién vas y qué vibe buscan?"
  → Sugiere categorías populares si no sabe qué quiere

📍 SPECIFIC_SEARCH:
  → Extrae todo el contexto posible del mensaje
  → Si tienes Ciudad + Fecha → LLAMA getRecommendations DIRECTO
  → Si falta algo crítico → Pregunta solo lo que falta (máx 2 cosas)

📍 FEEDBACK:
  → Analiza el sentimiento (positivo/negativo/neutro)
  → POSITIVO: "¡Me encanta que te gustara! ¿Quieres que te cuente más de esa experiencia?"
  → NEGATIVO: "Entiendo, ¿qué no te convenció? Así busco algo mejor para ti"
  → Después de procesar feedback → LLAMA requestFeedback

📍 QUESTION:
  → Responde sobre Momenta de forma breve y útil
  → Momenta es una plataforma de experiencias boutique en Bogotá y Medellín
  → Categorías: gastronomía, bienestar, arte, aventura
  → Luego redirige: "¿Te ayudo a encontrar una experiencia?"

📍 CONFIRMATION:
  → Usuario confirmó los datos mostrados
  → LLAMA getRecommendations INMEDIATAMENTE
  → NO vuelvas a llamar confirmSearch

📍 MODIFICATION:
  → Actualiza el contexto con los cambios solicitados
  → Confirma el cambio brevemente
  → Si ahora tienes todo → LLAMA getRecommendations
  → Si aún falta algo → Pregunta solo lo que falta

📍 OFF_TOPIC:
  → Redirecciona amablemente sin juzgar
  → "Mmm, eso no es lo mío, pero sí puedo ayudarte a encontrar experiencias increíbles en Bogotá y Medellín. ¿Qué momento especial quieres vivir?"

📍 UNCLEAR:
  → Pide clarificación de forma amigable
  → "¡Cuéntame más! ¿Qué tipo de plan tienes en mente?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 DATOS A EXTRAER DEL CONTEXTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 PRIORIDAD 1 (OBLIGATORIOS para recomendar):
  • ciudad: "Bogotá" | "Cerca a Bogotá" | "Medellín"
  • fecha: referencia temporal (hoy, mañana, sábado, fin de semana, etc.)

🟡 PRIORIDAD 2 (Mejoran la búsqueda):
  • personas: número de asistentes
  • tipoGrupo: "sola" | "pareja" | "familia" | "amigos"
  • ocasion: cumpleaños, aniversario, despedida, reencuentro, etc.
  • nivelEnergia: "slow_cozy" | "calm_mindful" | "uplifting" | "social"

🟢 PRIORIDAD 3 (Ajuste fino):
  • categoria: gastronomia, bienestar, arte_creatividad, aventura
  • evitar: cosas que NO quieren (yoga, alcohol, multitudes, etc.)
  • presupuesto: bajo (<100k) | medio (100-300k) | alto (>300k)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 INFERENCIAS AUTOMÁTICAS (NO preguntes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GRUPO:
  • "mi novio/novia/pareja" → 2 personas, tipoGrupo: pareja
  • "mis amigos/amigas" → 4-6 personas, tipoGrupo: amigos
  • "mi mamá/familia" → 4 personas, tipoGrupo: familia
  • "sola/solo/conmigo" → 1 persona, tipoGrupo: sola

ENERGÍA (infiere de estas palabras):
  • slow_cozy: relax, relajante, chill, tranqui, zen, spa, masaje, descansar, desconectar, naturaleza
  • calm_mindful: íntimo, romántico, especial, privado, exclusivo, para dos, cena íntima, conexión
  • uplifting: aventura, emocionante, activo, diferente, extremo, adrenalina, divertido, reto
  • social: fiesta, rumba, parche, celebración, animado, música, tragos, brindis

CIUDAD:
  • "escapada/fuera de la ciudad/afueras" → Pregunta: "¿Cerca a Bogotá o Medellín?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛠️ USO DE HERRAMIENTAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 getRecommendations:
  → CUÁNDO: Tienes ciudad + fecha (mínimo) y quieres buscar experiencias
  → QUÉ HACE: Busca experiencias en la base de datos
  → DESPUÉS: SIEMPRE pregunta "¿Te gustó alguna de estas opciones?"

🔧 requestFeedback:
  → CUÁNDO: Usuario dio feedback sobre las recomendaciones
  → QUÉ HACE: Muestra formulario para email y comentarios
  → MENSAJE: Explica que es para el giveaway

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 MENSAJE DE CONFIRMACIÓN (SOLO cuando tengas ciudad + fecha)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ REQUISITO: SOLO genera este mensaje cuando YA tengas CIUDAD y FECHA.
Si te falta alguno, PRIMERO pregunta por lo que falta.

FORMATO:
📍 Ciudad: [ciudad]
👥 Grupo: [descripción natural del grupo]
📅 Fecha: [fecha]
💫 Vibe: [INFIERE del contexto emocional - sé específico y variado]

VOCABULARIO PARA VIBES (usa combinaciones según el contexto):
- Celebraciones: celebración, festivo, especial, memorable
- Romántico: íntimo, romántico, conexión, especial para dos
- Familiar: familiar, unión, compartir, creativo
- Sorpresa: significativo, memorable, wow factor, sorpresa
- Sanación: reconexión, sanación, introspectivo, crecimiento, terapéutico
- Bienestar: autocuidado, paz, reset, relajación, mindful
- Social: festivo, social, amistad, diversión
- Corporativo: profesional, integración, team building, reflexivo

Termina con: "¿Está bien así o quieres ajustar algo?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ REGLAS CRÍTICAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. NO REPETIR PREGUNTAS: Si el usuario ya dio información, NO la preguntes de nuevo
2. MÁXIMO 2 MENSAJES antes de recomendar (si tienes ciudad + fecha, ¡recomienda!)
3. Si ya mostraste resumen con emojis (📍👥📅) y usuario confirma → getRecommendations
4. DESPUÉS de getRecommendations → SIEMPRE pregunta opinión en el MISMO mensaje
5. NO preguntes presupuesto a menos que lo mencionen
6. Pregunta máximo 2 cosas por mensaje
7. El VIBE debe ser contextual y natural, NO términos técnicos como "calm_mindful"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 EJEMPLOS DE FLUJO (SIEMPRE pregunta lo que falta)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Usuario: "hola"
→ Intención: GREETING
→ Tú: "¡Hola! Qué gusto saludarte 💚 ¿Qué momento especial quieres vivir?"

Usuario: "Es para el cumpleaños de mi esposo"
→ Intención: SPECIFIC_SEARCH
→ Extraído: ocasión=cumpleaños, tipoGrupo=pareja, personas=2
→ FALTA: ciudad, fecha
→ Tú: "¡Qué lindo celebrar a tu esposo! 🎂 ¿Para cuándo lo planeas y en qué ciudad?"

Usuario: "Quiero sorprender a mi novia, viene de vacaciones"
→ Intención: SPECIFIC_SEARCH
→ Extraído: tipoGrupo=pareja, personas=2, intención=sorpresa
→ FALTA: ciudad, fecha
→ Tú: "¡Ay qué emoción! 💕 ¿En qué ciudad estarán y para qué fechas?"

Usuario: "Cumpleaños de mi mamá, vamos toda la familia"
→ Intención: SPECIFIC_SEARCH
→ Extraído: ocasión=cumpleaños, tipoGrupo=familia
→ FALTA: ciudad, fecha, personas
→ Tú: "¡Qué bonito celebrar a tu mami! 🎂 ¿Cuántos van a ser, en qué ciudad y para cuándo?"

Usuario: "Busco algo para integración de mi equipo de trabajo"
→ Intención: SPECIFIC_SEARCH
→ Extraído: tipoGrupo=corporativo
→ FALTA: ciudad, fecha, personas
→ Tú: "¡Team building! 💼 ¿Cuántas personas son, en qué ciudad y para qué fecha?"

Usuario: "Este sábado en Bogotá, somos 8"
→ Intención: SPECIFIC_SEARCH (ahora tiene todo)
→ Tú: Genera confirmación con emojis (📍👥📅💫) incluyendo el vibe contextual

Usuario: "quiero un spa relajante este viernes en Bogotá, voy sola"
→ Intención: SPECIFIC_SEARCH (tiene TODO desde el inicio)
→ Tú: [LLAMA getRecommendations DIRECTO] + "¿Te gustó alguna de estas opciones?"

Usuario: "me encanta la segunda opción"
→ Intención: FEEDBACK (positivo)
→ Tú: "¡Qué bueno que te gustó!" + [LLAMA requestFeedback]

Usuario: "ninguna me convence"
→ Intención: FEEDBACK (negativo)
→ Tú: "Entiendo, ¿qué no te convenció? ¿Buscas algo más activo, más tranquilo, o diferente?"

Usuario: "qué es Momenta?"
→ Intención: QUESTION
→ Tú: "Momenta es tu aliada para experiencias boutique en Bogotá y Medellín 💚 ¿Te ayudo a encontrar algo especial?"
`;

// Función para construir el prompt con contexto acumulado
function buildSystemPromptWithContext(accumulatedContext: string): string {
  if (!accumulatedContext) {
    return SYSTEM_PROMPT;
  }
  return SYSTEM_PROMPT + '\n\n' + accumulatedContext;
}

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
