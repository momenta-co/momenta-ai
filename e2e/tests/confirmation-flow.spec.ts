import { test, expect } from '../fixtures/chat.fixture';

/**
 * Tests para el flujo de confirmación (Regla 12)
 *
 * Verifica que el AI siempre muestre bullets de confirmación
 * ANTES de llamar a getRecommendations
 */
test.describe('Flujo de Confirmación', () => {
  test('debe mostrar bullets de confirmación antes del carrusel', async ({ chat }) => {
    // Usuario da contexto completo en un solo mensaje
    await chat.sendMessage('Cumpleaños de mi esposo, este viernes, somos 4 personas en Bogotá');
    await chat.waitForResponse();

    // Debe mostrar bullets de confirmación (📍👥📅)
    const hasBullets = await chat.hasConfirmationBullets();
    expect(hasBullets).toBe(true);

    // NO debe mostrar carrusel todavía
    const hasCarousel = await chat.isCarouselVisible();
    expect(hasCarousel).toBe(false);
  });

  test('debe mostrar carrusel después de confirmación del usuario', async ({ chat }) => {
    // Paso 1: Usuario da contexto
    await chat.sendMessage('Algo romántico con mi novia este sábado');
    await chat.waitForResponse();

    // Verificar bullets
    const hasBullets = await chat.hasConfirmationBullets();
    expect(hasBullets).toBe(true);

    // Paso 2: Usuario confirma
    await chat.sendMessage('sí, dale');
    await chat.waitForResponse();

    // Ahora SÍ debe mostrar carrusel
    const hasCarousel = await chat.isCarouselVisible();
    expect(hasCarousel).toBe(true);
  });

  test('debe actualizar bullets cuando usuario modifica', async ({ chat }) => {
    // Paso 1: Usuario da contexto
    await chat.sendMessage('Cena con amigos este viernes, somos 5');
    await chat.waitForResponse();

    // Paso 2: Usuario modifica la fecha
    await chat.sendMessage('mejor el sábado');
    await chat.waitForResponse();

    // Debe mostrar bullets actualizados con sábado
    const hasText = await chat.hasTextInMessages(/sábado/i);
    expect(hasText).toBe(true);

    // NO debe mostrar carrusel todavía (necesita confirmación)
    const hasCarousel = await chat.isCarouselVisible();
    expect(hasCarousel).toBe(false);
  });

  test('debe aceptar diferentes formas de confirmación', async ({ chat }) => {
    // Contexto inicial
    await chat.sendMessage('Taller de cocina para 2 personas mañana');
    await chat.waitForResponse();

    // Confirmación informal
    await chat.sendMessage('perfecto, busca');
    await chat.waitForResponse();

    // Debe mostrar carrusel
    const hasCarousel = await chat.isCarouselVisible();
    expect(hasCarousel).toBe(true);
  });
});
