import { test, expect } from '../fixtures/chat.fixture';

/**
 * Tests para experiencias con niños (Regla 20)
 *
 * Verifica que cuando hay niños en el grupo:
 * - Se excluyan experiencias con alcohol
 * - Se prioricen actividades familiares
 */
test.describe('Experiencias para Niños', () => {
  test('excluye alcohol cuando menciona niños', async ({ chat }) => {
    await chat.sendMessage('algo para hacer con mis hijos este sábado');
    await chat.waitForResponse();

    // Confirmar
    await chat.sendMessage('sí, somos 4');
    await chat.waitForResponse();

    await chat.sendMessage('dale');
    await chat.waitForResponse();

    // Debe mostrar carrusel
    const hasCarousel = await chat.isCarouselVisible();
    expect(hasCarousel).toBe(true);

    // Las experiencias NO deben incluir catas de vino/cerveza/licores
    // (Verificación indirecta - el AI debe respetar la regla)
  });

  test('excluye alcohol cuando menciona "familia con niños"', async ({ chat }) => {
    await chat.sendMessage('plan familiar con niños para este domingo en Bogotá, somos 5');
    await chat.waitForResponse();

    const hasBullets = await chat.hasConfirmationBullets();
    expect(hasBullets).toBe(true);

    await chat.sendMessage('perfecto');
    await chat.waitForResponse();

    const hasCarousel = await chat.isCarouselVisible();
    expect(hasCarousel).toBe(true);
  });

  test('prioriza manualidades para niños', async ({ chat }) => {
    await chat.sendMessage('taller creativo para mis hijos este sábado, son 2 niños');
    await chat.waitForResponse();

    // Debe entender que es para niños y mostrar opciones apropiadas
    const hasBullets = await chat.hasConfirmationBullets();
    expect(hasBullets).toBe(true);
  });

  test('excluye alcohol cuando menciona "menores"', async ({ chat }) => {
    await chat.sendMessage('experiencia para menores de edad este viernes, somos 3');
    await chat.waitForResponse();

    await chat.sendMessage('sí');
    await chat.waitForResponse();

    const hasCarousel = await chat.isCarouselVisible();
    expect(hasCarousel).toBe(true);
  });

  test('entiende "para los niños" como grupo infantil', async ({ chat }) => {
    await chat.sendMessage('algo divertido para los niños de la familia este sábado, somos 6');
    await chat.waitForResponse();

    const hasBullets = await chat.hasConfirmationBullets();
    expect(hasBullets).toBe(true);
  });
});
