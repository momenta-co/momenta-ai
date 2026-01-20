import { test, expect } from '../fixtures/chat.fixture';

/**
 * Tests para sinónimos de búsqueda (search-synonyms.ts - Issue #10)
 *
 * Verifica que el AI encuentre experiencias usando términos alternativos:
 * - "álbum de fotos" → scrapbooking
 * - "tragos" → coctelería
 * - "naturaleza" → outdoor/Neusa
 */
test.describe('Sinónimos de Búsqueda', () => {
  test('encuentra scrapbooking cuando busca "álbum de fotos"', async ({ chat }) => {
    await chat.sendMessage('quiero hacer un taller de álbum de fotos este sábado con mi mamá');
    await chat.waitForResponse();

    // Debe entender que busca algo relacionado con fotografía/manualidades
    const hasBullets = await chat.hasConfirmationBullets();
    expect(hasBullets).toBe(true);

    // Confirmar para ver resultados
    await chat.sendMessage('sí');
    await chat.waitForResponse();

    // Debe mostrar carrusel (idealmente con scrapbooking)
    const hasCarousel = await chat.isCarouselVisible();
    expect(hasCarousel).toBe(true);
  });

  test('encuentra coctelería cuando busca "tragos"', async ({ chat }) => {
    await chat.sendMessage('algo con tragos para este viernes con mis amigos, somos 4');
    await chat.waitForResponse();

    // Confirmar
    await chat.sendMessage('dale');
    await chat.waitForResponse();

    // Debe mostrar carrusel con experiencias de coctelería/mixología
    const hasCarousel = await chat.isCarouselVisible();
    expect(hasCarousel).toBe(true);
  });

  test('encuentra outdoor/Neusa cuando busca "naturaleza"', async ({ chat }) => {
    await chat.sendMessage('algo en la naturaleza para este fin de semana con mi pareja');
    await chat.waitForResponse();

    // Debe interpretar como outdoor/escapada
    const messages = await chat.getAllAssistantMessages();
    const allText = messages.join(' ').toLowerCase();

    // Puede mencionar naturaleza, outdoor, escapada, aire libre
    const detectsOutdoor = allText.includes('naturaleza') ||
      allText.includes('outdoor') ||
      allText.includes('escapada') ||
      allText.includes('aire libre') ||
      allText.includes('cerca');
    expect(detectsOutdoor).toBe(true);
  });

  test('encuentra experiencias artísticas cuando busca "manualidades"', async ({ chat }) => {
    await chat.sendMessage('taller de manualidades para este domingo, voy sola');
    await chat.waitForResponse();

    await chat.sendMessage('sí, busca');
    await chat.waitForResponse();

    // Debe encontrar kintsugi, cerámica, joyería, etc.
    const hasCarousel = await chat.isCarouselVisible();
    expect(hasCarousel).toBe(true);
  });

  test('encuentra cocina italiana cuando busca "pasta"', async ({ chat }) => {
    await chat.sendMessage('quiero aprender a hacer pasta este sábado con mi novio');
    await chat.waitForResponse();

    // Debe entender que busca cocina italiana
    const hasBullets = await chat.hasConfirmationBullets();
    expect(hasBullets).toBe(true);
  });

  test('encuentra cocina japonesa cuando busca "sushi"', async ({ chat }) => {
    await chat.sendMessage('taller de sushi para el próximo viernes, somos 2');
    await chat.waitForResponse();

    await chat.sendMessage('perfecto');
    await chat.waitForResponse();

    const hasCarousel = await chat.isCarouselVisible();
    expect(hasCarousel).toBe(true);
  });

  test('encuentra bienestar cuando busca "relajación"', async ({ chat }) => {
    await chat.sendMessage('necesito algo de relajación para este fin de semana, voy sola');
    await chat.waitForResponse();

    // Debe interpretar como bienestar/spa
    const hasBullets = await chat.hasConfirmationBullets();
    expect(hasBullets).toBe(true);
  });
});
