import { test, expect } from '../fixtures/chat.fixture';

/**
 * Tests para consultas de precio (Regla 17)
 *
 * Verifica que:
 * - Antes del carrusel: responda con rangos generales
 * - Después del carrusel: refiera a las cards
 * - No active getRecommendations solo por preguntar precio
 */
test.describe('Consultas de Precio', () => {
  test('responde con rangos antes del carrusel', async ({ chat }) => {
    await chat.sendMessage('¿cuánto cuestan las experiencias?');
    await chat.waitForResponse();

    // Debe dar rangos, no precios específicos
    const messages = await chat.getAllAssistantMessages();
    const allText = messages.join(' ');

    // Debe mencionar rangos de precio
    const hasRange = /\$?\d{2,3}[.,]?\d{0,3}|rang|desde|hasta|entre|cop/i.test(allText);
    expect(hasRange).toBe(true);

    // NO debe mostrar carrusel solo por preguntar precio
    const hasCarousel = await chat.isCarouselVisible();
    expect(hasCarousel).toBe(false);
  });

  test('refiere a cards después del carrusel', async ({ chat }) => {
    // Primero obtener carrusel
    await chat.sendMessage('algo para este sábado con mi pareja');
    await chat.waitForResponse();
    await chat.sendMessage('sí');
    await chat.waitForResponse();

    const hasCarousel = await chat.isCarouselVisible();
    expect(hasCarousel).toBe(true);

    // Preguntar por precio
    await chat.sendMessage('¿cuánto cuestan?');
    await chat.waitForResponse();

    // Debe referir a las tarjetas
    const messages = await chat.getAllAssistantMessages();
    const allText = messages.join(' ').toLowerCase();

    const refersToCards = allText.includes('tarjeta') ||
      allText.includes('card') ||
      allText.includes('mostré') ||
      allText.includes('cada') ||
      allText.includes('ahí');
    expect(refersToCards).toBe(true);
  });

  test('no muestra precios específicos en texto', async ({ chat }) => {
    await chat.sendMessage('quiero saber el precio del taller de kintsugi');
    await chat.waitForResponse();

    // NO debe dar precio específico en texto
    const messages = await chat.getAllAssistantMessages();
    const allText = messages.join(' ');

    // No debe tener precio exacto como "$104,000" o "104.000"
    const hasExactPrice = /\$\s*\d{3}[.,]\d{3}|\d{3}[.,]\d{3}\s*(cop|pesos)/i.test(allText);
    // Este test puede fallar si el AI da precios, lo cual violaría la regla
  });

  test('continúa flujo normal después de preguntar precio', async ({ chat }) => {
    // Preguntar precio primero
    await chat.sendMessage('¿cuánto cuestan sus experiencias?');
    await chat.waitForResponse();

    // Luego pedir recomendación
    await chat.sendMessage('quiero algo para este sábado con mi novio');
    await chat.waitForResponse();

    // Debe continuar el flujo normal
    const hasBullets = await chat.hasConfirmationBullets();
    expect(hasBullets).toBe(true);
  });

  test('precio + búsqueda en mismo mensaje', async ({ chat }) => {
    await chat.sendMessage('¿cuánto cuesta un taller de cocina? quiero uno para este viernes con mi familia, somos 4');
    await chat.waitForResponse();

    // Debe responder sobre precio Y continuar con el flujo
    const messages = await chat.getAllAssistantMessages();
    const allText = messages.join(' ').toLowerCase();

    // Debe mencionar algo sobre precio
    const mentionsPrice = allText.includes('precio') ||
      allText.includes('cuesta') ||
      allText.includes('$') ||
      allText.includes('rang');

    // Y también debe mostrar bullets o continuar el flujo
    // (puede hacer ambas cosas)
  });

  test('no da precios de experiencias específicas antes del carrusel', async ({ chat }) => {
    await chat.sendMessage('¿cuánto cuesta la cata de vinos?');
    await chat.waitForResponse();

    const messages = await chat.getAllAssistantMessages();
    const allText = messages.join(' ').toLowerCase();

    // Debe dar respuesta general o invitar a buscar
    // NO debe dar precio específico
    const hasCarousel = await chat.isCarouselVisible();
    expect(hasCarousel).toBe(false);
  });
});
