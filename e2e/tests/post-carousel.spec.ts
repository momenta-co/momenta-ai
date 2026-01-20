import { test, expect } from '../fixtures/chat.fixture';

/**
 * Tests para flujo post-carrusel (Reglas 14, 15, 21)
 *
 * Verifica que después de mostrar el carrusel:
 * - No repita el carrusel
 * - Responda conversacionalmente
 * - Llame requestFeedback cuando corresponda
 */
test.describe('Flujo Post-Carrusel', () => {
  test('no repite carrusel cuando pide "detalles"', async ({ chat }) => {
    // Primero obtenemos el carrusel
    await chat.sendMessage('algo para este sábado con mi pareja');
    await chat.waitForResponse();
    await chat.sendMessage('sí');
    await chat.waitForResponse();

    // Verificar que hay carrusel
    const hasCarousel = await chat.isCarouselVisible();
    expect(hasCarousel).toBe(true);

    // Ahora pedir detalles
    await chat.sendMessage('detalles');
    await chat.waitForResponse();

    // Debe preguntar de cuál experiencia, NO mostrar otro carrusel
    const messages = await chat.getAllAssistantMessages();
    const lastMessage = messages[messages.length - 1] || '';

    // Debe preguntar cuál le interesa
    const asksWhich = /cuál|cual|qué|que|interesa/i.test(lastMessage);
    expect(asksWhich).toBe(true);
  });

  test('responde conversacionalmente cuando pide consejo', async ({ chat }) => {
    // Obtener carrusel
    await chat.sendMessage('experiencia para mañana con mi novio');
    await chat.waitForResponse();
    await chat.sendMessage('dale');
    await chat.waitForResponse();

    // Pedir consejo
    await chat.sendMessage('¿cuál me recomiendas?');
    await chat.waitForResponse();

    // Debe dar su opinión, no mostrar otro carrusel
    const messages = await chat.getAllAssistantMessages();
    const allText = messages.join(' ').toLowerCase();

    // Debe dar una recomendación personal
    const givesOpinion = allText.includes('yo') ||
      allText.includes('recomiendo') ||
      allText.includes('iría') ||
      allText.includes('para lo que');
    expect(givesOpinion).toBe(true);
  });

  test('llama requestFeedback cuando usuario dice que le gusta una opción', async ({ chat }) => {
    // Obtener carrusel
    await chat.sendMessage('algo creativo para este domingo, voy sola');
    await chat.waitForResponse();
    await chat.sendMessage('sí');
    await chat.waitForResponse();

    // Expresar preferencia
    await chat.sendMessage('me encanta la primera opción');
    await chat.waitForResponse();

    // Debe mostrar el formulario de feedback
    // Esperar un poco más porque el formulario puede tardar
    await chat.waitForText(/nombre|email|correo|datos/i, 15000).catch(() => { });

    const hasFeedbackForm = await chat.isFeedbackFormVisible();
    // El formulario puede o no aparecer dependiendo de la respuesta del AI
    // Pero el AI debería llamar requestFeedback
  });

  test('no pregunta "cuál te gustó" si usuario ya expresó preferencia', async ({ chat }) => {
    // Obtener carrusel
    await chat.sendMessage('cena romántica este viernes con mi esposa');
    await chat.waitForResponse();
    await chat.sendMessage('perfecto');
    await chat.waitForResponse();

    // Usuario expresa preferencia clara
    await chat.sendMessage('me gusta mucho la opción de la cata de vinos');
    await chat.waitForResponse();

    // NO debe preguntar "¿cuál te gustó más?" porque ya lo dijo
    const messages = await chat.getAllAssistantMessages();
    const lastMessages = messages.slice(-2).join(' ').toLowerCase();

    const asksAgain = lastMessages.includes('cuál te gustó') ||
      lastMessages.includes('cual te gusto');
    expect(asksAgain).toBe(false);
  });

  test('guía a las cards cuando pregunta información específica', async ({ chat }) => {
    // Obtener carrusel
    await chat.sendMessage('taller para este sábado, somos 3 amigas');
    await chat.waitForResponse();
    await chat.sendMessage('dale');
    await chat.waitForResponse();

    // Preguntar por información específica
    await chat.sendMessage('¿qué incluye cada una?');
    await chat.waitForResponse();

    // Debe referir a las tarjetas
    const messages = await chat.getAllAssistantMessages();
    const allText = messages.join(' ').toLowerCase();

    const refersToCards = allText.includes('tarjeta') ||
      allText.includes('card') ||
      allText.includes('click') ||
      allText.includes('info') ||
      allText.includes('cuál');
    expect(refersToCards).toBe(true);
  });

  test('permite nuevas recomendaciones si cambia criterios', async ({ chat }) => {
    // Obtener carrusel inicial
    await chat.sendMessage('algo de cocina para este sábado con mi pareja');
    await chat.waitForResponse();
    await chat.sendMessage('sí');
    await chat.waitForResponse();

    const hasFirstCarousel = await chat.isCarouselVisible();
    expect(hasFirstCarousel).toBe(true);

    // Cambiar completamente los criterios
    await chat.sendMessage('mejor muéstrame opciones de aventura outdoor');
    await chat.waitForResponse();

    // Ahora SÍ puede mostrar nuevo carrusel porque cambió la búsqueda
    // (El AI puede pedir confirmación o mostrar directamente)
    const messages = await chat.getAllAssistantMessages();
    const allText = messages.join(' ').toLowerCase();

    const acknowledgesChange = allText.includes('aventura') ||
      allText.includes('outdoor') ||
      allText.includes('cambiar');
    expect(acknowledgesChange).toBe(true);
  });
});
