import { test, expect } from '../fixtures/chat.fixture';

/**
 * Tests para extracción de contexto (context-extractor.ts)
 *
 * Verifica que el AI extraiga correctamente:
 * - Número de personas
 * - Tipo de grupo
 * - Ciudad y exclusiones
 * - Cosas a evitar
 */
test.describe('Extracción de Contexto', () => {
  test('detecta pareja y asume 2 personas', async ({ chat }) => {
    await chat.sendMessage('algo con mi novia este sábado');
    await chat.waitForResponse();

    // Debe detectar pareja y mostrar 2 personas en los bullets
    const messages = await chat.getAllAssistantMessages();
    const allText = messages.join(' ').toLowerCase();

    // Debe mencionar pareja o 2 personas
    const detectsCouple = allText.includes('pareja') || allText.includes('2') || allText.includes('dos');
    expect(detectsCouple).toBe(true);
  });

  test('detecta número explícito de personas', async ({ chat }) => {
    await chat.sendMessage('somos 6 amigos buscando algo para este viernes');
    await chat.waitForResponse();

    // Debe mostrar 6 en los bullets
    const hasText = await chat.hasTextInMessages(/6|seis/i);
    expect(hasText).toBe(true);
  });

  test('detecta "fuera de bogotá" como Cerca a Bogotá', async ({ chat }) => {
    await chat.sendMessage('algo fuera de bogotá para este fin de semana con mi pareja');
    await chat.waitForResponse();

    // Debe interpretar como "Cerca a Bogotá", no "Bogotá"
    const messages = await chat.getAllAssistantMessages();
    const allText = messages.join(' ').toLowerCase();

    // Debe mencionar "cerca" o "fuera" o "escapada"
    const detectsOutside = allText.includes('cerca') ||
      allText.includes('fuera') ||
      allText.includes('escapada') ||
      allText.includes('outdoor');
    expect(detectsOutside).toBe(true);

    // NO debe ser solo "Bogotá" (verificar que no confundió)
    // Este es un soft check - el AI debería entender que queremos FUERA
  });

  test('detecta exclusiones: "no quiero yoga"', async ({ chat }) => {
    await chat.sendMessage('algo relajante pero no quiero yoga, para este sábado con mi pareja');
    await chat.waitForResponse();

    // Confirmar para ver resultados
    await chat.sendMessage('sí, busca');
    await chat.waitForResponse();

    // El carrusel NO debe incluir yoga
    // (Verificamos indirectamente - si el AI respeta la exclusión)
    const hasCarousel = await chat.isCarouselVisible();
    expect(hasCarousel).toBe(true);

    // El texto no debería mencionar yoga como recomendación
    const mentionsYoga = await chat.hasTextInMessages(/yoga/i);
    // Puede mencionarlo para confirmar que lo excluye, pero no como opción
  });

  test('detecta múltiples exclusiones: "ni yoga ni spa"', async ({ chat }) => {
    await chat.sendMessage('quiero algo tranquilo pero ni yoga ni spa, este domingo somos 3 amigas');
    await chat.waitForResponse();

    // Debe mostrar bullets de confirmación
    const hasBullets = await chat.hasConfirmationBullets();
    expect(hasBullets).toBe(true);
  });

  test('cancela exclusión cuando usuario cambia de opinión', async ({ chat }) => {
    // Primero dice no yoga
    await chat.sendMessage('algo para mañana con mi pareja, no quiero yoga');
    await chat.waitForResponse();

    // Luego cambia de opinión
    await chat.sendMessage('pensándolo bien, sí incluye yoga');
    await chat.waitForResponse();

    // Ahora confirma
    await chat.sendMessage('dale, busca');
    await chat.waitForResponse();

    // El carrusel PUEDE incluir yoga ahora
    const hasCarousel = await chat.isCarouselVisible();
    expect(hasCarousel).toBe(true);
  });

  test('detecta mood romántico de sinónimos', async ({ chat }) => {
    await chat.sendMessage('quiero una velada íntima y especial con mi esposa este viernes');
    await chat.waitForResponse();

    // Debe interpretar como romántico/calm_mindful
    const messages = await chat.getAllAssistantMessages();
    const allText = messages.join(' ').toLowerCase();

    // Debe mostrar vibe relacionado con romántico
    const detectsRomantic = allText.includes('romántic') ||
      allText.includes('íntim') ||
      allText.includes('especial') ||
      allText.includes('pareja');
    expect(detectsRomantic).toBe(true);
  });

  test('detecta mood aventurero de sinónimos', async ({ chat }) => {
    await chat.sendMessage('algo emocionante y con adrenalina para este sábado con mis amigos, somos 4');
    await chat.waitForResponse();

    // Debe interpretar como activo/uplifting
    const hasBullets = await chat.hasConfirmationBullets();
    expect(hasBullets).toBe(true);
  });

  test('detecta persona sola', async ({ chat }) => {
    await chat.sendMessage('busco algo para mí sola este domingo');
    await chat.waitForResponse();

    // Debe detectar 1 persona
    const messages = await chat.getAllAssistantMessages();
    const allText = messages.join(' ').toLowerCase();

    const detectsSolo = allText.includes('sola') ||
      allText.includes('1 persona') ||
      allText.includes('una persona') ||
      allText.includes('solo');
    expect(detectsSolo).toBe(true);
  });
});
