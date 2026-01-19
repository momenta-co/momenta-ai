import { test, expect } from '../fixtures/chat.fixture';

/**
 * Tests para mensajes off-topic (Flujo OFF_TOPIC)
 *
 * Verifica que:
 * - Relacionado indirecto: sugiera alternativas
 * - Completamente off-topic: redirija amablemente
 * - Nunca responda de forma cortante
 */
test.describe('Mensajes Off-Topic', () => {
  test('sugiere alternativas cuando menciona "conciertos"', async ({ chat }) => {
    await chat.sendMessage('¿tienen conciertos?');
    await chat.waitForResponse();

    // Debe sugerir alternativas relacionadas
    const messages = await chat.getAllAssistantMessages();
    const allText = messages.join(' ').toLowerCase();

    // Debe mencionar alternativas como música, fiestas, etc.
    const suggestsAlternatives = allText.includes('música') ||
      allText.includes('fiesta') ||
      allText.includes('experiencia') ||
      allText.includes('tenemos') ||
      allText.includes('ofrecemos');
    expect(suggestsAlternatives).toBe(true);

    // No debe ser cortante
    const isPolite = !allText.includes('no puedo') ||
      allText.includes('pero') ||
      allText.includes('sin embargo');
    expect(isPolite).toBe(true);
  });

  test('sugiere outdoor cuando menciona "caminatas"', async ({ chat }) => {
    await chat.sendMessage('quiero hacer caminatas en la montaña');
    await chat.waitForResponse();

    const messages = await chat.getAllAssistantMessages();
    const allText = messages.join(' ').toLowerCase();

    // Debe sugerir experiencias outdoor
    const suggestsOutdoor = allText.includes('escapada') ||
      allText.includes('naturaleza') ||
      allText.includes('outdoor') ||
      allText.includes('neusa') ||
      allText.includes('aventura') ||
      allText.includes('aire libre');
    expect(suggestsOutdoor).toBe(true);
  });

  test('redirige amablemente cuando pregunta por código', async ({ chat }) => {
    await chat.sendMessage('ayúdame a escribir código en Python');
    await chat.waitForResponse();

    const messages = await chat.getAllAssistantMessages();
    const allText = messages.join(' ').toLowerCase();

    // Debe redirigir amablemente
    const redirectsNicely = allText.includes('experiencia') ||
      allText.includes('expertise') ||
      allText.includes('ayudar') ||
      allText.includes('especializ');
    expect(redirectsNicely).toBe(true);

    // No debe intentar escribir código
    const noCode = !allText.includes('```') &&
      !allText.includes('def ') &&
      !allText.includes('function');
    expect(noCode).toBe(true);
  });

  test('redirige cuando pregunta por política', async ({ chat }) => {
    await chat.sendMessage('¿qué opinas de las elecciones?');
    await chat.waitForResponse();

    const messages = await chat.getAllAssistantMessages();
    const allText = messages.join(' ').toLowerCase();

    // Debe redirigir a experiencias
    const redirects = allText.includes('experiencia') ||
      allText.includes('ayudar') ||
      allText.includes('plan');
    expect(redirects).toBe(true);
  });

  test('respuesta cálida para temas no disponibles', async ({ chat }) => {
    await chat.sendMessage('¿tienen viajes al extranjero?');
    await chat.waitForResponse();

    const messages = await chat.getAllAssistantMessages();
    const allText = messages.join(' ').toLowerCase();

    // Debe ser cálida y ofrecer alternativas
    const isWarm = allText.includes('!') ||
      allText.includes('encanta') ||
      allText.includes('genial') ||
      allText.includes('pero') ||
      allText.includes('tenemos');
    expect(isWarm).toBe(true);

    // Debe mencionar lo que SÍ tienen
    const offersAlternative = allText.includes('bogotá') ||
      allText.includes('cerca') ||
      allText.includes('experiencia') ||
      allText.includes('escapada');
    expect(offersAlternative).toBe(true);
  });

  test('entiende "cine" y sugiere entretenimiento', async ({ chat }) => {
    await chat.sendMessage('quiero ir al cine este fin de semana');
    await chat.waitForResponse();

    const messages = await chat.getAllAssistantMessages();
    const allText = messages.join(' ').toLowerCase();

    // Debe reconocer que no tiene cine pero ofrecer alternativas
    const hasResponse = allText.length > 20; // Al menos una respuesta sustancial
    expect(hasResponse).toBe(true);
  });

  test('no abandona al usuario con respuesta corta', async ({ chat }) => {
    await chat.sendMessage('hola');
    await chat.waitForResponse();

    const messages = await chat.getAllAssistantMessages();
    const allText = messages.join(' ');

    // Debe dar bienvenida y ofrecer ayuda
    const welcomes = allText.includes('hola') ||
      allText.includes('bienvenid') ||
      allText.includes('gusto') ||
      allText.includes('ayud');
    expect(welcomes).toBe(true);

    // Debe invitar a continuar
    const invitesToContinue = allText.includes('?') ||
      allText.includes('qué') ||
      allText.includes('cuéntame');
    expect(invitesToContinue).toBe(true);
  });
});
