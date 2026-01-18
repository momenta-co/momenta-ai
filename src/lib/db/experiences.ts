import { prisma } from './prisma';
import type { Experience } from '@/lib/intelligence/types';

/**
 * Transform database experience to application Experience type
 * Maps database schema to TypeScript interface
 */
function transformDbExperience(dbExp: any): Experience {
  // Parse tags from JSON if available
  const tags = Array.isArray(dbExp.tags) ? dbExp.tags : [];

  // Format duration from minutes to human-readable format
  const formatDuration = (minutes: number | null): string | null => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes} minutos`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} horas ${mins} minutos` : `${hours} horas`;
  };

  // Calculate price from min/max - Issue #1: Add "Desde" prefix
  const price = dbExp.price_min
    ? {
      amount: dbExp.price_min.toString(),
      currency: 'COP',
      unit: 'por persona',
      prefix: 'Desde', // Indicates this is the minimum price
    }
    : null;

  return {
    id: dbExp.id,
    title: dbExp.title,
    description: dbExp.description_short || '',
    url: dbExp.source_url || `https://www.momentaboutique.com/experiencias/${dbExp.id}`,
    image: dbExp.image_url || '',
    categories: tags,
    price,
    duration: formatDuration(dbExp.duration_minutes),
    minPeople: dbExp.min_people ?? 1,
    location: dbExp.city,
  };
}

/**
 * Fetch all active experiences from database
 * @returns Array of Experience objects
 */
export async function getAllExperiences(): Promise<Experience[]> {
  try {
    const experiences = await prisma.experiences.findMany({
      where: {
        status: 'active',
      },
      select: {
        id: true,
        title: true,
        description_short: true,
        city: true,
        price_min: true,
        price_max: true,
        duration_minutes: true,
        tags: true,
        image_url: true,
        source_url: true,
        min_people: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return experiences.map(transformDbExperience);
  } catch (error) {
    console.error('Error fetching experiences from database:', error);
    throw new Error('Failed to fetch experiences from database');
  }
}

/**
 * Fetch experiences by city or location tag
 * @param city - City name (e.g., "Bogotá", "Medellín") or "Cerca a Bogotá"
 * @param excludeCities - Optional array of cities to exclude (e.g., ["Bogotá"] for "fuera de Bogotá")
 * @returns Array of Experience objects for that city/location
 */
export async function getExperiencesByCity(city: string, excludeCities?: string[]): Promise<Experience[]> {
  try {
    // Handle "Cerca a Bogotá" as a tag filter
    const isCercaBogota = city.toLowerCase().includes('cerca') && city.toLowerCase().includes('bogot');

    if (isCercaBogota) {
      // Filter by tag "Cerca a Bogotá"
      const allExperiences = await prisma.experiences.findMany({
        where: {
          status: 'active',
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      // Filter experiences that have "Cerca a Bogotá" tag
      let cercaExperiences = allExperiences.filter((exp: any) => {
        const tags = Array.isArray(exp.tags) ? exp.tags : [];
        return tags.some((tag: string) =>
          tag.toLowerCase().includes('cerca') && tag.toLowerCase().includes('bogot')
        );
      });

      // Issue #3: If user wants to exclude certain cities (e.g., "fuera de Bogotá"),
      // filter out experiences that are IN those cities
      if (excludeCities && excludeCities.length > 0) {
        cercaExperiences = cercaExperiences.filter((exp: any) => {
          const expCity = exp.city?.toLowerCase() || '';
          const tags = Array.isArray(exp.tags) ? exp.tags : [];

          // Check if experience is in any excluded city
          for (const excludeCity of excludeCities) {
            const excludeLower = excludeCity.toLowerCase();
            // Check city field
            if (expCity.includes(excludeLower)) {
              return false;
            }
            // Check tags for "En [Ciudad]"
            const hasExcludedCityTag = tags.some((tag: string) =>
              tag.toLowerCase().includes('en ' + excludeLower) ||
              tag.toLowerCase() === excludeLower
            );
            if (hasExcludedCityTag) {
              return false;
            }
          }
          return true;
        });
        console.log(`[getExperiencesByCity] After excluding ${excludeCities.join(', ')}: ${cercaExperiences.length} experiences`);
      }

      console.log(`[getExperiencesByCity] Found ${cercaExperiences.length} "Cerca a Bogotá" experiences`);

      // If we have fewer than 8 "Cerca a Bogotá" experiences AND no city exclusions,
      // also include Bogotá experiences. But if user explicitly excluded Bogotá, don't add them back!
      const shouldAddBogotaFallback = cercaExperiences.length < 8 &&
        (!excludeCities || !excludeCities.some(c => c.toLowerCase().includes('bogot')));

      if (shouldAddBogotaFallback) {
        const bogotaExperiences = allExperiences.filter((exp: any) => {
          const city = exp.city?.toLowerCase() || '';
          const tags = Array.isArray(exp.tags) ? exp.tags : [];
          const hasBogotaTag = tags.some((tag: string) =>
            tag.toLowerCase().includes('bogotá') || tag.toLowerCase().includes('bogota')
          );
          // Include if city is Bogotá OR has "En Bogotá" tag, but NOT if already in cercaExperiences
          const isCerca = tags.some((tag: string) =>
            tag.toLowerCase().includes('cerca') && tag.toLowerCase().includes('bogot')
          );
          return (city.includes('bogotá') || city.includes('bogota') || hasBogotaTag) && !isCerca;
        });

        console.log(`[getExperiencesByCity] Adding ${bogotaExperiences.length} Bogotá experiences as fallback`);

        // Combine: "Cerca a Bogotá" first, then Bogotá experiences
        const combined = [...cercaExperiences, ...bogotaExperiences];
        return combined.map(transformDbExperience);
      }

      return cercaExperiences.map(transformDbExperience);
    }

    // Standard city filter
    const experiences = await prisma.experiences.findMany({
      where: {
        city: {
          contains: city,
          mode: 'insensitive',
        },
        status: 'active',
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return experiences.map(transformDbExperience);
  } catch (error) {
    console.error('Error fetching experiences by city:', error);
    throw new Error(`Failed to fetch experiences for city: ${city}`);
  }
}

/**
 * Fetch experience by ID
 * @param id - Experience ID
 * @returns Experience object or null
 */
export async function getExperienceById(id: string): Promise<Experience | null> {
  try {
    const experience = await prisma.experiences.findUnique({
      where: { id },
    });

    return experience ? transformDbExperience(experience) : null;
  } catch (error) {
    console.error('Error fetching experience by ID:', error);
    throw new Error(`Failed to fetch experience with ID: ${id}`);
  }
}
