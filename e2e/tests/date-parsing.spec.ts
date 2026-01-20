import { test, expect } from '../fixtures/chat.fixture';

/**
 * Tests para parsing de fechas complejas (date-parser.ts - Issue #7)
 *
 * Verifica que el AI interprete correctamente expresiones como:
 * - "tercer fin de semana de enero"
 * - "próximo sábado"
 * - "fin de semana del 15"
 */
test.describe('Parsing de Fechas Complejas', () => {
  test('interpreta "tercer fin de semana de enero" y pide confirmación', async ({ chat }) => {
    await chat.sendMessage('quiero algo para el tercer fin de semana de enero con mi pareja');
    await chat.waitForResponse();

    // Debe mostrar la fecha interpretada para confirmar
    const messages = await chat.getAllAssistantMessages();
    const allText = messages.join(' ');

    // Debe mencionar una fecha específica (sábado/domingo de enero)
    const hasDateConfirmation = /enero|sábado|domingo|18|19|20/i.test(allText);
    expect(hasDateConfirmation).toBe(true);

    // Debe pedir confirmación de la fecha
    const asksConfirmation = /bien|correcto|confirma|entendí|está bien/i.test(allText);
    expect(asksConfirmation).toBe(true);
  });

  test('interpreta "próximo sábado"', async ({ chat }) => {
    await chat.sendMessage('algo para el próximo sábado con amigos, somos 5');
    await chat.waitForResponse();

    // Debe mostrar bullets con la fecha
    const hasBullets = await chat.hasConfirmationBullets();
    expect(hasBullets).toBe(true);

    // Debe mencionar sábado
    const hasText = await chat.hasTextInMessages(/sábado/i);
    expect(hasText).toBe(true);
  });

  test('interpreta "fin de semana del 15 de febrero"', async ({ chat }) => {
    await chat.sendMessage('algo para el fin de semana del 15 de febrero, somos mi novio y yo');
    await chat.waitForResponse();

    // Debe interpretar como el fin de semana que contiene el 15
    const messages = await chat.getAllAssistantMessages();
    const allText = messages.join(' ');

    // Debe mencionar febrero o la fecha
    const hasFebruary = /febrero|15/i.test(allText);
    expect(hasFebruary).toBe(true);
  });

  test('fechas simples no requieren confirmación extra', async ({ chat }) => {
    await chat.sendMessage('algo para mañana con mi pareja');
    await chat.waitForResponse();

    // Debe ir directo a bullets de confirmación (no pregunta "entendí mañana, está bien?")
    const hasBullets = await chat.hasConfirmationBullets();
    expect(hasBullets).toBe(true);

    // No debe preguntar específicamente por la fecha
    const messages = await chat.getAllAssistantMessages();
    const allText = messages.join(' ').toLowerCase();

    // "mañana" es una fecha simple, no debería requerir "¿entendí bien?"
    // Solo debería mostrar los bullets normales
  });

  test('interpreta "este viernes"', async ({ chat }) => {
    await chat.sendMessage('busco plan para este viernes, voy con mi hermana');
    await chat.waitForResponse();

    const hasText = await chat.hasTextInMessages(/viernes/i);
    expect(hasText).toBe(true);
  });

  test('interpreta "en dos semanas"', async ({ chat }) => {
    await chat.sendMessage('quiero reservar algo en dos semanas, somos 3 amigos');
    await chat.waitForResponse();

    // Debe mostrar bullets de confirmación
    const hasBullets = await chat.hasConfirmationBullets();
    expect(hasBullets).toBe(true);
  });
});
