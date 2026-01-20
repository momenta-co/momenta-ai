import { test as base, expect, Page } from '@playwright/test';

/**
 * Chat Fixture - Helpers para interactuar con el chat de Momenta
 */
export interface ChatHelpers {
  /** Envía un mensaje al chat */
  sendMessage: (message: string) => Promise<void>;

  /** Espera a que el AI responda (deja de cargar) */
  waitForResponse: () => Promise<void>;

  /** Obtiene el último mensaje del assistant */
  getLastAssistantMessage: () => Promise<string>;

  /** Verifica si el carrusel de experiencias está visible */
  isCarouselVisible: () => Promise<boolean>;

  /** Verifica si los bullets de confirmación están visibles (📍👥📅) */
  hasConfirmationBullets: () => Promise<boolean>;

  /** Verifica si el formulario de feedback está visible */
  isFeedbackFormVisible: () => Promise<boolean>;

  /** Obtiene todos los mensajes del assistant */
  getAllAssistantMessages: () => Promise<string[]>;

  /** Verifica si un texto específico está en algún mensaje */
  hasTextInMessages: (text: string | RegExp) => Promise<boolean>;

  /** Espera a que aparezca un texto específico */
  waitForText: (text: string | RegExp, timeout?: number) => Promise<void>;

  /** Cuenta el número de experiencias en el carrusel */
  countCarouselItems: () => Promise<number>;
}

/**
 * Crea los helpers del chat para una página
 */
function createChatHelpers(page: Page): ChatHelpers {
  let messageCountBefore = 0;

  return {
    async sendMessage(message: string) {
      // Guardar el número de mensajes antes de enviar
      const messages = page.locator('[class*="bg-secondary"]');
      messageCountBefore = await messages.count();

      const textarea = page.locator('textarea');
      await textarea.fill(message);
      await page.locator('button[aria-label="Enviar"]').click();
    },

    async waitForResponse() {
      // Estrategia: esperar a que aparezca al menos un mensaje nuevo del assistant
      // y que el textarea esté habilitado de nuevo

      // 1. Esperar a que aparezca un nuevo mensaje
      await page.waitForFunction(
        (prevCount) => {
          const messages = document.querySelectorAll('[class*="bg-secondary"]');
          return messages.length > prevCount;
        },
        messageCountBefore,
        { timeout: 45000 }
      );

      // 2. Esperar a que el textarea no esté deshabilitado
      await page.waitForFunction(
        () => {
          const textarea = document.querySelector('textarea');
          return textarea && !textarea.disabled;
        },
        {},
        { timeout: 10000 }
      );

      // 3. Pequeña espera adicional para streaming
      await page.waitForTimeout(1000);
    },

    async getLastAssistantMessage() {
      const messages = page.locator('.bg-secondary\\/50');
      const count = await messages.count();
      if (count === 0) return '';
      return await messages.nth(count - 1).textContent() || '';
    },

    async isCarouselVisible() {
      // El carrusel contiene ExperienceCards que son links a momenta.com.co
      // Buscamos links que apunten a experiencias o cards con estructura específica
      const experienceLinks = page.locator('a[href*="momenta.com.co"], a[href*="/experiencias/"]');
      const cardCount = await experienceLinks.count();

      if (cardCount > 0) return true;

      // Alternativa: buscar el contenedor del slider por estructura
      const sliderContainer = page.locator('div:has(> div:has(a[target="_blank"]))').filter({
        has: page.locator('img'),
      });

      return (await sliderContainer.count()) > 0;
    },

    async hasConfirmationBullets() {
      // Los bullets tienen emojis específicos: 📍👥📅💫
      const bulletPatterns = ['📍', '👥', '📅'];
      const messages = await this.getAllAssistantMessages();
      const allText = messages.join(' ');

      return bulletPatterns.every((emoji) => allText.includes(emoji));
    },

    async isFeedbackFormVisible() {
      // El formulario de feedback tiene campos de nombre, email, etc.
      const form = page.locator('form').filter({ hasText: /nombre|email|correo/i });
      return await form.isVisible().catch(() => false);
    },

    async getAllAssistantMessages() {
      const messages = page.locator('.bg-secondary\\/50');
      const count = await messages.count();
      const texts: string[] = [];

      for (let i = 0; i < count; i++) {
        const text = await messages.nth(i).textContent();
        if (text) texts.push(text);
      }

      return texts;
    },

    async hasTextInMessages(text: string | RegExp) {
      const messages = await this.getAllAssistantMessages();
      const allText = messages.join(' ');

      if (typeof text === 'string') {
        return allText.toLowerCase().includes(text.toLowerCase());
      }
      return text.test(allText);
    },

    async waitForText(text: string | RegExp, timeout = 30000) {
      await page.waitForFunction(
        ({ text, isRegex }) => {
          const messages = document.querySelectorAll('.bg-secondary\\/50');
          const allText = Array.from(messages)
            .map((m) => m.textContent || '')
            .join(' ');

          if (isRegex) {
            return new RegExp(text).test(allText);
          }
          return allText.toLowerCase().includes(text.toLowerCase());
        },
        { text: text instanceof RegExp ? text.source : text, isRegex: text instanceof RegExp },
        { timeout }
      );
    },

    async countCarouselItems() {
      // Cuenta las cards de experiencia en el carrusel
      const cards = page.locator('[class*="experience-card"], [class*="ExperienceCard"]');
      return await cards.count();
    },
  };
}

/**
 * Extended test con chat helpers
 */
export const test = base.extend<{ chat: ChatHelpers }>({
  chat: async ({ page }, use) => {
    // Navegar a la página principal
    await page.goto('/');

    // Esperar a que el chat esté listo
    await page.waitForSelector('textarea', { timeout: 10000 });

    // Cerrar modal de bienvenida beta si aparece
    try {
      // El modal tiene un botón "¡Vamos!" o un botón X con aria-label="Cerrar"
      const vamosButton = page.locator('button:has-text("¡Vamos!")');

      if (await vamosButton.isVisible({ timeout: 3000 })) {
        await vamosButton.click();
        // Esperar a que la animación de cierre termine
        await page.waitForTimeout(500);
      }
    } catch {
      // No hay modal, continuar
    }

    // Esperar a que el overlay desaparezca completamente
    try {
      await page.waitForFunction(
        () => !document.querySelector('.fixed.inset-0.bg-black\\/50'),
        { timeout: 5000 }
      );
    } catch {
      // No hay overlay o ya desapareció
    }

    // Crear y proveer los helpers
    const helpers = createChatHelpers(page);
    await use(helpers);
  },
});

export { expect };
