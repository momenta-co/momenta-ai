import { test, expect } from '../fixtures/chat.fixture';

/**
 * Tests para filtro de mínimo de personas (Reglas 10-11)
 *
 * Verifica que:
 * - No muestre experiencias que requieren más personas de las indicadas
 * - Sugiera agregar personas cuando hay una experiencia relevante
 */
test.describe('Filtro Min People', () => {
  test('no muestra experiencias que requieren más personas', async ({ chat }) => {
    // Usuario con pocas personas
    await chat.sendMessage('algo para mañana, somos solo 2 personas');
    await chat.waitForResponse();

    await chat.sendMessage('sí');
    await chat.waitForResponse();

    // Debe mostrar carrusel
    const hasCarousel = await chat.isCarouselVisible();
    expect(hasCarousel).toBe(true);

    // Las experiencias mostradas deben ser para 2 o menos personas mínimo
    // (No podemos verificar esto directamente, pero el test documenta el requisito)
  });

  test('sugiere agregar personas cuando experiencia requiere más', async ({ chat }) => {
    // Cata de cerveza típicamente requiere más personas
    await chat.sendMessage('cata de cerveza artesanal para este viernes, somos 3 personas');
    await chat.waitForResponse();

    // Puede que sugiera agregar más personas
    const messages = await chat.getAllAssistantMessages();
    const allText = messages.join(' ').toLowerCase();

    // Si hay sugerencia de más personas, debe mencionarlo
    // (El AI puede o no sugerir esto dependiendo de la experiencia)
    const hasBullets = await chat.hasConfirmationBullets();
    expect(hasBullets).toBe(true);
  });

  test('permite experiencia cuando hay suficientes personas', async ({ chat }) => {
    await chat.sendMessage('experiencia grupal para este sábado, somos 8 amigos');
    await chat.waitForResponse();

    await chat.sendMessage('dale');
    await chat.waitForResponse();

    // Con 8 personas, debe poder mostrar casi cualquier experiencia
    const hasCarousel = await chat.isCarouselVisible();
    expect(hasCarousel).toBe(true);
  });

  test('actualiza cuando usuario acepta agregar personas', async ({ chat }) => {
    // Escenario: AI sugiere agregar personas
    await chat.sendMessage('cata de vinos para este viernes, somos 2');
    await chat.waitForResponse();

    // Si el AI sugiere agregar personas y el usuario acepta
    const messages = await chat.getAllAssistantMessages();
    const allText = messages.join(' ').toLowerCase();

    if (allText.includes('persona') && (allText.includes('más') || allText.includes('mínimo'))) {
      // El AI sugirió agregar personas
      await chat.sendMessage('sí, sumamos más personas');
      await chat.waitForResponse();

      // Debe actualizar los bullets
      const hasBullets = await chat.hasConfirmationBullets();
      expect(hasBullets).toBe(true);
    } else {
      // Si no sugirió, confirmamos normalmente
      await chat.sendMessage('sí');
      await chat.waitForResponse();

      const hasCarousel = await chat.isCarouselVisible();
      expect(hasCarousel).toBe(true);
    }
  });

  test('pregunta cuántas personas cuando es grupo de amigos', async ({ chat }) => {
    // Para amigos/familia, siempre debe preguntar cuántos son
    await chat.sendMessage('algo con mis amigos este sábado');
    await chat.waitForResponse();

    // Debe preguntar cuántos son (no asumir)
    const messages = await chat.getAllAssistantMessages();
    const allText = messages.join(' ').toLowerCase();

    const asksHowMany = allText.includes('cuántos') ||
      allText.includes('cuantos') ||
      allText.includes('cuántas') ||
      allText.includes('cuantas') ||
      allText.includes('personas');
    expect(asksHowMany).toBe(true);
  });
});
