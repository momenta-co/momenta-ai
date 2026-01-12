import { getExperiencesByCity } from "@/lib/db/experiences";
import { generateAIRecommendations, preFilterByEnergy, preFilterByMinPeople, preFilterByUserExclusions } from "@/lib/intelligence/ai-service";
import {
  RecommendationCard
} from "@/lib/intelligence/tool-types";
import { NivelEnergia, Presupuesto, TipoGrupo, UserContext } from "@/lib/intelligence/types";
import { tool } from "ai";
import z from "zod";

export const getRecommendations = tool({
  description: `
    Busca experiencias en la base de datos según los criterios del usuario.

    CUÁNDO USAR:
    - Usuario confirmó el resumen que mostraste (dice "sí", "dale", "perfecto", "ok")
    - O tienes toda la información necesaria (ciudad + fecha como mínimo)

    ⚠️ CRÍTICO - LEE EL RESULTADO COMPLETO:
    El resultado incluye:
    - recommendations: lista de experiencias disponibles
    - morePeopleSuggestion: mensaje sobre experiencias que requieren más personas (puede ser null)

    DESPUÉS DE RECIBIR EL RESULTADO:
    1. PRIMERO revisa si "morePeopleSuggestion" tiene valor (no es null)
    2. Si morePeopleSuggestion existe, MENCIONA ESO PRIMERO antes de las recomendaciones:
       "Tenemos la Cata Cervecera que buscas, pero requiere mínimo 5 personas. Si suman un amigo más, la incluimos 🍻
        Mientras tanto, estas son otras opciones geniales para 4 personas:"
    3. Si morePeopleSuggestion es null, muestra las recomendaciones normalmente

    ⚠️ OBLIGATORIO AL FINAL:
    SIEMPRE termina con EXACTAMENTE esta pregunta (activa el siguiente flujo):
    "Pudiste revisar las experiencias, ¿cuál te gustó más? 😊"

    NO digas "¿Listos para reservar?" ni "¿Hacemos la reserva?" - eso rompe el flujo.
  `,
  inputSchema: z.object({
    // MENSAJES UI (Opcionales - para control de rendering en frontend)
    introMessage: z.string().optional().describe(
      'Mensaje cálido introduciendo las recomendaciones. Opcional pero recomendado para mejor UX.'
    ),
    followUpQuestion: z.string().optional().describe(
      'Pregunta de seguimiento después del carrusel. Opcional pero recomendado.'
    ),

    // PRIORIDAD 1 (Requeridos)
    ciudad: z.string().describe('Ciudad: "Bogotá" o "Cerca de Bogotá"'),
    fecha: z.string().describe('Fecha o referencia temporal: "este sábado", "mañana", "15 de enero"'),
    personas: z.number().describe('Número de personas'),

    // PRIORIDAD 2 (Importantes)
    tipoGrupo: z.enum(['sola', 'pareja', 'familia', 'amigos']).describe('Tipo de grupo'),
    generoGrupo: z.enum(['masculino', 'femenino', 'mixto', 'no_especificado']).optional()
      .describe('Género del grupo: masculino (amigos, parceros, los muchachos), femenino (amigas, las chicas), mixto, no_especificado'),
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

      // PRE-FILTER 2: Remove experiences the user explicitly wants to avoid
      if (params.evitar && params.evitar.length > 0) {
        const beforeUserFilter = experiences.length;
        experiences = preFilterByUserExclusions(experiences, params.evitar);
        console.log(`[getRecommendations] User exclusion pre-filter: ${beforeUserFilter} → ${experiences.length} experiences (evitar: ${params.evitar.join(', ')})`);
      }

      // PRE-FILTER 3: Remove experiences where min_people > user's group size
      let minPeopleFilterResult = { filtered: experiences, excludedByMinPeople: [] as { title: string; minPeople: number }[], nextThreshold: null as number | null };
      if (params.personas && params.personas > 0) {
        const beforeMinPeopleFilter = experiences.length;
        minPeopleFilterResult = preFilterByMinPeople(experiences, params.personas);
        experiences = minPeopleFilterResult.filtered;
        console.log(`[getRecommendations] Min people pre-filter: ${beforeMinPeopleFilter} → ${experiences.length} experiences (personas: ${params.personas})`);
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
        generoGrupo: params.generoGrupo as any,
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

      // Build suggestion for more people if there are excluded experiences
      // Only suggest if: the excluded experiences are relevant to what user asked for
      let morePeopleSuggestion: string | null = null;
      if (minPeopleFilterResult.excludedByMinPeople.length > 0 && params.categoria) {
        // Filter excluded experiences that match the user's requested category
        const categoryLower = params.categoria.toLowerCase();
        const relevantExcluded = minPeopleFilterResult.excludedByMinPeople.filter(exp =>
          exp.title.toLowerCase().includes(categoryLower) ||
          (categoryLower === 'cerveza' && exp.title.toLowerCase().includes('cervecer'))
        );

        if (relevantExcluded.length > 0) {
          const excludedTitles = relevantExcluded.map(e => e.title).join(', ');
          const minRequired = Math.min(...relevantExcluded.map(e => e.minPeople));
          morePeopleSuggestion = `La experiencia "${excludedTitles}" requiere mínimo ${minRequired} personas. Si agregan más amigos, podrían acceder a ella.`;
          console.log(`[getRecommendations] morePeopleSuggestion (relevant): ${morePeopleSuggestion}`);
        }
      }

      return {
        status: 'success',
        success: true,
        introMessage: params.introMessage,
        followUpQuestion: params.followUpQuestion,
        recommendations,
        context: params,
        morePeopleSuggestion,
        excludedCount: minPeopleFilterResult.excludedByMinPeople.length,
      };
    } catch (error) {
      console.error('[getRecommendations] Error:', error);
      return {
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
  execute: async ({ contextMessage, recommendationContext }) => {
    console.log('[requestFeedback] Called with:', { contextMessage, recommendationContext });

    return {
      success: true,
      message: contextMessage,
      showFeedbackForm: true,
      context: recommendationContext || null
    };
  }
})
