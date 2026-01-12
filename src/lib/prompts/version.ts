/**
 * Prompt Version Control
 *
 * Update this file whenever you make changes to any prompt section.
 * This helps track changes and debug issues related to prompt modifications.
 */

export const PROMPT_VERSION = '1.1.0';

export const PROMPT_CHANGELOG: Record<string, string> = {
  '1.0.0': 'Initial modularization - extracted catalog, intentions, flows, examples, and rules',
  '1.1.0': 'Added introMessage and followUpQuestion to getRecommendations for structured UI rendering (intro → carousel → question)',
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
