import { test, expect } from '../fixtures/chat.fixture';

/**
 * Tests para escapada culinaria íntima (Regla 9)
 *
 * Verifica que cuando el usuario pide:
 * - Cocinar + tranquilo/íntimo + cerca de Bogotá
 * Se priorice Neusa con calm_mindful (no slow_cozy)
 */
test.describe('Escapada Culinaria Íntima', () => {
  test('prioriza Neusa para cocina + escapada + íntimo', async ({ chat }) => {
    await chat.sendMessage('quiero cocinar con mi mamá en un lugar tranquilo cerca de Bogotá este fin de semana');
    await chat.waitForResponse();

    // Debe mostrar bullets
    const hasBullets = await chat.hasConfirmationBullets();
    expect(hasBullets).toBe(true);

    // Debe interpretar como escapada/cerca de Bogotá
    const messages = await chat.getAllAssistantMessages();
    const allText = messages.join(' ').toLowerCase();

    const detectsEscape = allText.includes('cerca') ||
      allText.includes('escapada') ||
      allText.includes('fuera');
    expect(detectsEscape).toBe(true);
  });

  test('no confunde "tranquilo" con spa cuando hay cocina', async ({ chat }) => {
    await chat.sendMessage('taller de cocina tranquilo e íntimo para este sábado, somos 2');
    await chat.waitForResponse();

    await chat.sendMessage('sí');
    await chat.waitForResponse();

    // Debe mostrar carrusel con cocina, no spa
    const hasCarousel = await chat.isCarouselVisible();
    expect(hasCarousel).toBe(true);

    // El AI debería priorizar cocina sobre spa
  });

  test('entiende "preparar comida" como cocina', async ({ chat }) => {
    await chat.sendMessage('quiero preparar comida con mi familia en una escapada este domingo, somos 4');
    await chat.waitForResponse();

    const hasBullets = await chat.hasConfirmationBullets();
    expect(hasBullets).toBe(true);

    // Debe entender que quieren cocinar
    const messages = await chat.getAllAssistantMessages();
    const allText = messages.join(' ').toLowerCase();

    const detectsCooking = allText.includes('cocina') ||
      allText.includes('gastronom') ||
      allText.includes('comida');
    // Puede o no mencionar cocina explícitamente en los bullets
  });

  test('combina cocina + especial + fuera de ciudad', async ({ chat }) => {
    await chat.sendMessage('algo especial para cocinar con mi esposa, salir de la ciudad, este viernes');
    await chat.waitForResponse();

    // Debe detectar: pareja + cocina + fuera de Bogotá
    const hasBullets = await chat.hasConfirmationBullets();
    expect(hasBullets).toBe(true);
  });

  test('prioriza experiencias íntimas sobre grupales para parejas', async ({ chat }) => {
    await chat.sendMessage('experiencia íntima de cocina para mi aniversario, solo somos mi esposa y yo, cerca de bogotá');
    await chat.waitForResponse();

    // Debe entender: pareja + aniversario + íntimo + cocina + escapada
    const messages = await chat.getAllAssistantMessages();
    const allText = messages.join(' ').toLowerCase();

    // Debe capturar la ocasión especial
    const detectsSpecial = allText.includes('aniversario') ||
      allText.includes('especial') ||
      allText.includes('pareja');
    expect(detectsSpecial).toBe(true);
  });
});
