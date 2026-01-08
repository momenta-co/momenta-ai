import { streamText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { generateAIRecommendations } from '@/lib/intelligence/ai-service';
import { getAllExperiences } from '@/lib/db/experiences';
import type { UserContext } from '@/lib/intelligence/types';

// Schema for extracting user context from conversation
const userContextSchema = z.object({
  occasion: z.string().describe('The occasion or reason for the experience (e.g., "Cumpleaños de mi mamá", "Cita romántica")'),
  withWho: z.string().describe('Who will participate in the experience (e.g., "5 personas", "Mi pareja", "Solo/a")'),
  mood: z.string().describe('Desired mood or vibe (e.g., "Relajado", "Aventurero", "Romántico")'),
  budget: z.number().describe('Budget per person in COP (Colombian pesos)'),
  city: z.string().describe('City where the experience should take place (e.g., "Bogotá", "Medellín")'),
});

// Create JSON Schema manually for OpenAI function calling
const userContextJsonSchema = {
  type: 'object',
  properties: {
    occasion: {
      type: 'string',
      description: 'The occasion or reason for the experience (e.g., "Cumpleaños de mi mamá", "Cita romántica")',
    },
    withWho: {
      type: 'string',
      description: 'Who will participate in the experience (e.g., "5 personas", "Mi pareja", "Solo/a")',
    },
    mood: {
      type: 'string',
      description: 'Desired mood or vibe (e.g., "Relajado", "Aventurero", "Romántico")',
    },
    budget: {
      type: 'number',
      description: 'Budget per person in COP (Colombian pesos)',
    },
    city: {
      type: 'string',
      description: 'City where the experience should take place (e.g., "Bogotá", "Medellín")',
    },
  },
  required: ['occasion', 'withWho', 'mood', 'budget', 'city'],
  additionalProperties: false,
};

console.log('JSON Schema:', JSON.stringify(userContextJsonSchema, null, 2));

/**
 * POST /api/chat
 * Conversational AI endpoint using AI SDK
 * Handles natural conversation and extracts user context to generate recommendations
 */
export async function POST(req: Request) {
  const { messages } = await req.json();

  console.log('Incoming messages:', messages);

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: `Eres el asistente conversacional de Momenta Boutique, una plataforma que ofrece experiencias únicas en Colombia.

Tu objetivo es tener una conversación natural y amigable con los usuarios para entender qué tipo de experiencia están buscando.

IMPORTANTE:
- Sé cálido, amigable y conversacional (usa el tono de Momenta: cercano, sofisticado pero accesible)
- Haz preguntas de seguimiento de forma natural cuando falte información
- NO pidas toda la información de golpe en un solo mensaje
- Pregunta UNA cosa a la vez, de forma conversacional
- Cuando el usuario mencione algo, reconócelo antes de preguntar lo siguiente
- Si el usuario no menciona el presupuesto, pregunta un rango aproximado en pesos colombianos (ej: "¿Tienes un presupuesto en mente? Podría ser algo como 100.000, 200.000 o más por persona")
- Si el usuario no menciona la ciudad, asume Bogotá a menos que especifique otra ciudad
- Mantén las respuestas cortas y naturales (2-3 oraciones máximo)

INFORMACIÓN QUE NECESITAS RECOPILAR:
1. Ocasión: ¿Para qué es la experiencia? (cumpleaños, cita, celebración, etc.)
2. Con quién: ¿Cuántas personas? ¿Tipo de grupo? (familia, pareja, amigos, etc.)
3. Mood/Vibe: ¿Qué tipo de experiencia buscan? (relajante, aventurera, cultural, romántica, etc.)
4. Presupuesto: ¿Cuál es el presupuesto aproximado por persona en pesos colombianos?
5. Ciudad: ¿En qué ciudad? (si no lo mencionan, asume Bogotá)

Cuando tengas TODA esta información, di exactamente: "READY_FOR_RECOMMENDATIONS" seguido de un resumen en una sola línea como: "Ocasión: X | Con quién: Y | Mood: Z | Presupuesto: W | Ciudad: V"

Ejemplos de buen estilo conversational:
- "¡Qué lindo! ¿Cuántas personas van a ir?"
- "Me encanta la idea. ¿Tienen un presupuesto aproximado en mente?"
- "Perfecto, ya casi está. ¿Buscan algo más relajado o algo con más acción?"`,
    messages,
  });

  return result.toTextStreamResponse();
}
