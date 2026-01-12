import { getExperiencesByCity } from "@/lib/db/experiences";
import { generateAIRecommendations, preFilterByEnergy, preFilterByUserExclusions } from "@/lib/intelligence/ai-service";
import { NivelEnergia, Presupuesto, TipoGrupo, UserContext } from "@/lib/intelligence/types";
import {
  RecommendationsToolOutput,
  RecommendationsToolInput,
  RecommendationCard,
  FeedbackToolInput,
  FeedbackToolOutput,
} from "@/lib/intelligence/tool-types";
import { tool } from "ai";
import z from "zod";

const GET_RECOMMENDATIONS = {
  prompt: {
    v1: `
      Busca experiencias en la base de datos según los criterios del usuario.

      CUÁNDO USAR:
      - Usuario confirmó el resumen que mostraste (dice "sí", "dale", "perfecto", "ok")
      - O tienes toda la información necesaria (ciudad + fecha como mínimo)

      CRÍTICO - CÓMO USAR:
      1. Proporciona introMessage: Un mensaje cálido introduciendo las recomendaciones (ej: "Aquí van algunas experiencias relajantes perfectas para el cumpleaños 🎉")
      2. Proporciona followUpQuestion: La pregunta de seguimiento (ej: "¿Cuál te llamó más la atención?")
      3. NO escribas texto DESPUÉS de llamar esta herramienta - todo va en los campos introMessage y followUpQuestion
    `,
    v2: `
      Busca experiencias en la base de datos según los criterios del usuario.
    `,
  },
  introMessage: {
    v1: 'Mensaje cálido introduciendo las recomendaciones y ajustando el tono según el contexto de la ocasion. Ej: "Aquí van algunas experiencias relajantes perfectas para el cumpleaños 🎉"',
    v2: 'Mensaje cálido introduciendo las recomendaciones y ajustando el tono según el contexto de la ocasion.',
  },
  followUpQuestion: {
    v1: 'Pregunta de seguimiento después del carrusel que ajuste el tono según el contexto de la ocasion. Ej: "¿Cuál te llamó más la atención?"',
    v2: 'Pregunta de seguimiento después del carrusel que ajuste el tono según el contexto de la ocasion.',
  }
}

export const getRecommendations = tool({
  description: GET_RECOMMENDATIONS.prompt.v2,
  inputSchema: z.object({
    // MENSAJES DE UI (Requeridos)
    introMessage: z.string().describe(GET_RECOMMENDATIONS.introMessage.v2),
    followUpQuestion: z.string().describe(GET_RECOMMENDATIONS.followUpQuestion.v2),

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
  async *execute(params: RecommendationsToolInput): AsyncGenerator<RecommendationsToolOutput> {
    console.log('[getRecommendations] Called with:', params);
    yield { status: 'loading', message: 'Buscando experiencias...' };

    try {
      const rawExperiences = await getExperiencesByCity(params.ciudad);
      yield { status: 'loading', message: 'Filtrando experiencias...' };
      // PRE-FILTER 1: Remove experiences that contradict energy level
      let experiences = preFilterByEnergy(rawExperiences, params.nivelEnergia);

      // PRE-FILTER 2: Remove experiences the user explicitly wants to avoid
      if (params.evitar && params.evitar.length > 0) {
        const beforeUserFilter = experiences.length;
        experiences = preFilterByUserExclusions(experiences, params.evitar);
        console.log(`[getRecommendations] User exclusion pre-filter: ${beforeUserFilter} → ${experiences.length} experiences (evitar: ${params.evitar.join(', ')})`);
      }

      if (!experiences || experiences.length === 0) {
        yield {
          status: 'error',
          success: false,
          error: 'No hay experiencias disponibles en esta ciudad',
          recommendations: [],
        };
        return;
      }

      yield { status: 'loading', message: 'Generando recomendaciones...' };
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

      console.log('[getRecommendations] Called with:', params);
      const aiResult = await generateAIRecommendations(userContext, experiences);

      // Map to frontend format
      const recommendations: RecommendationCard[] = aiResult.map((rec) => ({
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

      yield {
        status: 'success',
        success: true,
        introMessage: params.introMessage,
        followUpQuestion: params.followUpQuestion,
        recommendations,
        context: params,
      };
    } catch (error) {
      console.error('[getRecommendations] Error:', error);
      yield {
        status: 'error',
        success: false,
        error: 'Error generando recomendaciones',
        recommendations: [],
      };
    }
  },
})

export const requestFeedback = tool({
  description: `
    Solicita feedback del usuario sobre las recomendaciones mostradas.

    CUÁNDO USAR:
    - INMEDIATAMENTE después de que el usuario respondió a "Pudiste revisar las experiencias - cuál te gustó mas?"

    CÓMO USAR (FLUJO OBLIGATORIO):
    1. Usuario responde sobre las experiencias
    2. Determina si la respuesta es POSITIVA o NEGATIVA
    3. En el MISMO mensaje donde llamas esta herramienta, incluye el texto apropiado:
        - POSITIVO: "Eso! Me encanta que te haya gustado. Antes de finalizar la reserva, me ayudarías con estos datos porfi para formalizar tu participación en el giveaway? Mil gracias!"
        - NEGATIVO: "Entiendo, ¿qué no te convenció? Así busco algo mejor para ti. Antes de ajustar, me ayudarías con estos datos porfi para formalizar tu participación en el giveaway? Mil gracias!"
    4. INMEDIATAMENTE llamas requestFeedback con contextMessage que incluye ese texto
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
  execute: async ({ contextMessage, recommendationContext }: FeedbackToolInput): Promise<FeedbackToolOutput> => {
    console.log('[requestFeedback] Called with:', { contextMessage, recommendationContext });

    return {
      success: true,
      message: contextMessage,
      showFeedbackForm: true,
      context: recommendationContext || null
    };
  }
})
