/**
 * Search Synonyms Module (Issue #10)
 *
 * This module provides synonym expansion for search terms to improve
 * discovery of experiences when users use different terminology.
 *
 * Example: "taller de álbumes de fotografía" should find "scrapbooking"
 */

/**
 * Dictionary of search synonyms
 * Key: term the user might search for
 * Value: array of related terms/experience names that should match
 */
export const SEARCH_SYNONYMS: Record<string, string[]> = {
  // Photography / Scrapbooking
  'álbum': ['scrapbook', 'scrapbooking', 'fotografía', 'fotos', 'recuerdos', 'manualidades'],
  'álbumes': ['scrapbook', 'scrapbooking', 'fotografía', 'fotos', 'recuerdos'],
  'fotografía': ['scrapbook', 'scrapbooking', 'fotos', 'álbum', 'recuerdos'],
  'fotos': ['scrapbook', 'scrapbooking', 'fotografía', 'álbum'],

  // Arts & Crafts
  'manualidades': ['kintsugi', 'cerámica', 'joyería', 'scrapbook', 'scrapbooking', 'arte', 'taller'],
  'arte': ['kintsugi', 'cerámica', 'joyería', 'pintura', 'manualidades', 'creativo'],
  'artístico': ['kintsugi', 'cerámica', 'joyería', 'pintura', 'arte', 'creativo'],
  'creativo': ['kintsugi', 'cerámica', 'joyería', 'pintura', 'arte', 'manualidades'],

  // Nature / Outdoor
  'naturaleza': ['outdoor', 'neusa', 'campo', 'aventura', 'aire libre', 'escapada', 'montaña'],
  'campo': ['outdoor', 'neusa', 'naturaleza', 'escapada', 'aire libre'],
  'montaña': ['outdoor', 'neusa', 'naturaleza', 'aventura', 'senderismo'],
  'aire libre': ['outdoor', 'naturaleza', 'campo', 'aventura', 'neusa'],

  // Drinks
  'tragos': ['coctelería', 'mixología', 'licores', 'cocteles', 'bar'],
  'cocteles': ['coctelería', 'mixología', 'tragos', 'bar'],
  'licor': ['licores', 'destilados', 'cata', 'aguardiente'],
  'licores': ['destilados', 'cata', 'aguardiente', 'licor'],
  'bebidas': ['coctelería', 'vino', 'cerveza', 'licores', 'café'],

  // Cooking types
  'italiana': ['pasta', 'italian', 'cocina italiana'],
  'pasta': ['italiana', 'cocina italiana', 'italian'],
  'japonesa': ['sushi', 'japón', 'cocina japonesa'],
  'sushi': ['japonesa', 'japón', 'cocina japonesa'],
  'mexicana': ['tacos', 'tamalitos', 'méxico', 'cocina mexicana'],

  // Wellness
  'relajación': ['spa', 'masaje', 'bienestar', 'yoga', 'relax'],
  'bienestar': ['spa', 'masaje', 'yoga', 'relajación', 'wellness'],
  'masajes': ['masaje', 'spa', 'relajación', 'bienestar'],

  // Special occasions
  'romántico': ['pareja', 'íntimo', 'cena', 'privado', 'especial'],
  'celebración': ['fiesta', 'cumpleaños', 'brindis', 'festejo'],
  'cumpleaños': ['celebración', 'fiesta', 'especial', 'festejo'],
};

/**
 * Expand search terms to include synonyms
 * @param query - The user's original search query
 * @returns Array of expanded terms including original and synonyms
 */
export function expandSearchTerms(query: string): string[] {
  const normalizedQuery = query.toLowerCase().trim();
  const words = normalizedQuery.split(/\s+/);
  const expandedTerms = new Set<string>([normalizedQuery]);

  // Add individual words
  for (const word of words) {
    expandedTerms.add(word);

    // Look for synonym matches
    const cleanWord = word.replace(/[.,!?¿¡]/g, '');
    if (SEARCH_SYNONYMS[cleanWord]) {
      for (const synonym of SEARCH_SYNONYMS[cleanWord]) {
        expandedTerms.add(synonym.toLowerCase());
      }
    }
  }

  // Also check multi-word phrases
  for (const [term, synonyms] of Object.entries(SEARCH_SYNONYMS)) {
    if (normalizedQuery.includes(term)) {
      for (const synonym of synonyms) {
        expandedTerms.add(synonym.toLowerCase());
      }
    }
  }

  return Array.from(expandedTerms);
}

/**
 * Check if an experience matches any of the expanded terms
 * @param experience - Experience title and description
 * @param expandedTerms - Array of terms to match against
 * @returns Boolean indicating if there's a match
 */
export function matchesExpandedTerms(
  experience: { title: string; description: string; categories: string[] },
  expandedTerms: string[]
): boolean {
  const searchableText = [
    experience.title,
    experience.description,
    ...experience.categories
  ].join(' ').toLowerCase();

  return expandedTerms.some(term => searchableText.includes(term));
}

/**
 * Generate synonym awareness section for the AI prompt
 * This helps the AI understand that certain terms map to specific experiences
 */
export const SYNONYM_AWARENESS_SECTION = `
═══════════════════════════════════════════════════
🔍 SINÓNIMOS DE BÚSQUEDA - EXPANDE TU COMPRENSIÓN
═══════════════════════════════════════════════════

Cuando el usuario busca con estos términos, TAMBIÉN considera estas experiencias:

📷 "álbum de fotos" / "fotografía" / "recuerdos":
→ INCLUYE: Taller de Scrapbooking, manualidades con fotos

🎨 "manualidades" / "arte" / "creativo":
→ INCLUYE: Kintsugi, Cerámica, Joyería, Scrapbooking, Pintura

🌿 "naturaleza" / "campo" / "aire libre":
→ INCLUYE: Neusa, experiencias outdoor, escapadas, aventura

🍸 "tragos" / "cocteles":
→ INCLUYE: Taller de Coctelería, Mixología

🍝 "pasta" / "italiana":
→ INCLUYE: Taller de Pasta Italiana

🍣 "sushi" / "japonesa":
→ INCLUYE: Taller de Sushi

⚠️ IMPORTANTE: Si el usuario dice un término genérico,
busca experiencias que coincidan con los sinónimos,
no solo con el término exacto.
`;
