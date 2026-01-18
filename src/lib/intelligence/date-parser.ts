/**
 * Date Parser Module (Issue #7)
 *
 * Uses chrono-node to parse complex Spanish date expressions like:
 * - "tercer fin de semana de enero"
 * - "próximo sábado"
 * - "el 15 de febrero"
 *
 * Always shows the interpreted date to the user for confirmation.
 */

import * as chrono from 'chrono-node';

export interface ParsedDate {
  /** The parsed Date object */
  date: Date;
  /** End date if it's a range (e.g., weekend) */
  endDate?: Date;
  /** Human-readable display string in Spanish */
  displayString: string;
  /** Whether this is a complex date that needs user confirmation */
  needsConfirmation: boolean;
  /** Original text that was parsed */
  originalText: string;
}

/**
 * Spanish day names
 */
const SPANISH_DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const SPANISH_MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

/**
 * Format a date in Spanish
 */
function formatDateSpanish(date: Date): string {
  const day = SPANISH_DAYS[date.getDay()];
  const dayNum = date.getDate();
  const month = SPANISH_MONTHS[date.getMonth()];
  return `${day.charAt(0).toUpperCase() + day.slice(1)} ${dayNum} de ${month}`;
}

/**
 * Get the nth weekend of a month
 * @param year - Year
 * @param month - Month (0-indexed)
 * @param n - Which weekend (1 = first, 2 = second, etc.)
 * @returns Object with saturday and sunday dates
 */
function getNthWeekendOfMonth(year: number, month: number, n: number): { saturday: Date; sunday: Date } {
  // Start from the first day of the month
  const firstDay = new Date(year, month, 1);

  // Find the first Saturday
  let dayOfWeek = firstDay.getDay();
  let daysUntilSaturday = (6 - dayOfWeek + 7) % 7;
  if (daysUntilSaturday === 0 && dayOfWeek !== 6) {
    daysUntilSaturday = 7;
  }

  const firstSaturday = new Date(year, month, 1 + daysUntilSaturday);

  // Add (n-1) weeks to get the nth Saturday
  const targetSaturday = new Date(firstSaturday);
  targetSaturday.setDate(targetSaturday.getDate() + (n - 1) * 7);

  // Get the Sunday after
  const targetSunday = new Date(targetSaturday);
  targetSunday.setDate(targetSunday.getDate() + 1);

  return { saturday: targetSaturday, sunday: targetSunday };
}

/**
 * Parse special Spanish date patterns that chrono-node might miss
 */
function parseSpecialPatterns(text: string, refDate: Date): ParsedDate | null {
  const normalizedText = text.toLowerCase().trim();

  // Pattern: "tercer fin de semana de enero" (nth weekend of month)
  const nthWeekendPattern = /\b(primer|segundo|tercer|cuarto|quinto|1er|2do|3er|4to|5to)\s+fin\s+de\s+semana\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/i;
  const nthWeekendMatch = normalizedText.match(nthWeekendPattern);

  if (nthWeekendMatch) {
    const ordinalMap: Record<string, number> = {
      'primer': 1, '1er': 1,
      'segundo': 2, '2do': 2,
      'tercer': 3, '3er': 3,
      'cuarto': 4, '4to': 4,
      'quinto': 5, '5to': 5,
    };

    const n = ordinalMap[nthWeekendMatch[1].toLowerCase()];
    const monthIndex = SPANISH_MONTHS.indexOf(nthWeekendMatch[2].toLowerCase());

    if (n && monthIndex !== -1) {
      // Determine the year (current year if month is in future, next year if month is in past)
      let year = refDate.getFullYear();
      const currentMonth = refDate.getMonth();
      if (monthIndex < currentMonth) {
        year += 1;
      }

      const { saturday, sunday } = getNthWeekendOfMonth(year, monthIndex, n);

      return {
        date: saturday,
        endDate: sunday,
        displayString: `${formatDateSpanish(saturday)} y ${formatDateSpanish(sunday)}`,
        needsConfirmation: true, // Complex dates need confirmation
        originalText: text,
      };
    }
  }

  // Pattern: "fin de semana de [date]" - weekend containing a specific date
  const weekendOfPattern = /\bfin\s+de\s+semana\s+del?\s+(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/i;
  const weekendOfMatch = normalizedText.match(weekendOfPattern);

  if (weekendOfMatch) {
    const dayNum = parseInt(weekendOfMatch[1]);
    const monthIndex = SPANISH_MONTHS.indexOf(weekendOfMatch[2].toLowerCase());

    if (monthIndex !== -1 && dayNum >= 1 && dayNum <= 31) {
      let year = refDate.getFullYear();
      const currentMonth = refDate.getMonth();
      if (monthIndex < currentMonth || (monthIndex === currentMonth && dayNum < refDate.getDate())) {
        year += 1;
      }

      const targetDate = new Date(year, monthIndex, dayNum);
      const dayOfWeek = targetDate.getDay();

      // Find the Saturday of that week
      const daysToSaturday = (6 - dayOfWeek + 7) % 7;
      const saturday = new Date(targetDate);
      saturday.setDate(targetDate.getDate() - dayOfWeek + 6);

      const sunday = new Date(saturday);
      sunday.setDate(saturday.getDate() + 1);

      return {
        date: saturday,
        endDate: sunday,
        displayString: `${formatDateSpanish(saturday)} y ${formatDateSpanish(sunday)}`,
        needsConfirmation: true,
        originalText: text,
      };
    }
  }

  return null;
}

/**
 * Parse a Spanish date expression
 * @param text - The text containing the date
 * @param refDate - Reference date (defaults to now)
 * @returns Parsed date info or null if no date found
 */
export function parseSpanishDate(text: string, refDate?: Date): ParsedDate | null {
  const reference = refDate || new Date();

  // First try our special patterns for complex Spanish expressions
  const specialResult = parseSpecialPatterns(text, reference);
  if (specialResult) {
    return specialResult;
  }

  // Use chrono-node for standard date parsing
  const results = chrono.es.parse(text, reference);

  if (results.length === 0) {
    return null;
  }

  const result = results[0];
  const parsedDate = result.start.date();

  // Check if it's a weekend/range
  const hasEnd = result.end !== undefined;
  const endDate = hasEnd ? result.end!.date() : undefined;

  // Determine if this needs confirmation (complex expressions)
  const isComplexExpression =
    text.toLowerCase().includes('fin de semana') ||
    text.toLowerCase().includes('semana') ||
    text.toLowerCase().includes('próximo') ||
    text.toLowerCase().includes('siguiente');

  // Format the display string
  let displayString: string;
  if (endDate) {
    displayString = `${formatDateSpanish(parsedDate)} - ${formatDateSpanish(endDate)}`;
  } else {
    displayString = formatDateSpanish(parsedDate);
  }

  return {
    date: parsedDate,
    endDate,
    displayString,
    needsConfirmation: isComplexExpression,
    originalText: text,
  };
}

/**
 * Generate confirmation message for complex dates
 */
export function generateDateConfirmationMessage(parsed: ParsedDate): string {
  return `📅 Entendí: ${parsed.displayString}. ¿Está bien o prefieres otra fecha?`;
}

/**
 * Date confirmation flow guidance for the AI prompt
 */
export const DATE_CONFIRMATION_SECTION = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 CONFIRMACIÓN DE FECHAS COMPLEJAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cuando el usuario menciona fechas complejas como:
- "tercer fin de semana de enero"
- "próximo sábado"
- "fin de semana del 15"

→ SIEMPRE muestra la fecha interpretada para confirmar:
   "📅 Entendí: Sábado 18 y Domingo 19 de enero. ¿Está bien?"

→ Espera confirmación del usuario antes de recomendar

→ Si el usuario corrige la fecha, usa la nueva fecha

REGLA: Las fechas simples como "hoy", "mañana", "el 20 de enero" NO necesitan confirmación.
Solo confirma cuando hay ambigüedad (fines de semana, ordinales, etc.).
`;
