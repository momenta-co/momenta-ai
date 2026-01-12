/**
 * Prompt Version Control
 *
 * Update this file whenever you make changes to any prompt section.
 * This helps track changes and debug issues related to prompt modifications.
 */

export const PROMPT_VERSION = '1.5.0';

export const PROMPT_CHANGELOG: Record<string, string> = {
  '1.0.0': 'Initial modularization - extracted catalog, intentions, flows, examples, and rules',
  '1.1.0': 'Added specific category flow: Chat AI passes specific categories (italiana, japonesa, etc.) to getRecommendations, and AI service prioritizes matching experiences',
  '1.2.0': 'Added duplicate title filtering in AI service and prompt instructions to prevent same experience appearing twice',
  '1.2.1': 'Fixed bug: mapAIResponseToRecommendations now uses filtered experiences list (experiencesToUse) to match AI indices correctly',
  '1.2.2': 'Added deduplicateByTitle pre-filter to remove duplicate experiences BEFORE sending to AI',
  '1.3.0': 'Added gastronomic coherence rule: when category is food/beverage specific, ALL 5 recommendations must be food/beverage related',
  '1.4.0': 'Beta mode: Removed city question from conversation flow - always assume Bogotá. City only shown in confirmation message, not asked during chat.',
  '1.4.1': 'Personalized response for other cities: "De momento solo operamos en Bogotá, pero pronto estaremos en [ciudad]!"',
  '1.5.0': 'Escapada culinaria íntima: cuando usuario pide cocinar + tranquilo + cerca de Bogotá, priorizar Neusa con calm_mindful (no slow_cozy). Cocinar juntos en escapada = actividad íntima.',
};

export const LAST_UPDATED = '2026-01-11';

export const CONTRIBUTORS = [
  // Add your name when you make significant prompt changes
  'Initial Team',
];

/**
 * Returns a version header for the system prompt
 */
export function getVersionHeader(): string {
  return `[PROMPT VERSION: ${PROMPT_VERSION} | Last Updated: ${LAST_UPDATED}]`;
}
