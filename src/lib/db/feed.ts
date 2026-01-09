import { prisma } from './prisma';
import type { Experience } from '@/types/experience';

/**
 * Transform database experience to Feed Experience type
 */
function transformToFeedExperience(dbExp: any): Experience {
  const tags = Array.isArray(dbExp.tags) ? dbExp.tags : [];

  const formatDuration = (minutes: number | null): string | null => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes} minutos`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} horas ${mins} minutos` : `${hours} horas`;
  };

  const price = dbExp.price_min
    ? {
      amount: dbExp.price_min.toString(),
      currency: 'COP',
      unit: 'per_person',
    }
    : null;

  return {
    id: dbExp.id,
    title: dbExp.title,
    description: dbExp.description_short || '',
    url: dbExp.source_url || `/experiencias/${dbExp.slug || dbExp.id}`,
    image: dbExp.image_url || '',
    categories: tags,
    price,
    duration: formatDuration(dbExp.duration_minutes),
    min_people: null,
    location: dbExp.city,
    source_page: 'database',
  };
}

/**
 * Shuffle array to randomize experiences
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get diverse experiences from multiple cities
 */
async function getDiverseExperiences(limit: number): Promise<any[]> {
  // Fetch more than needed to ensure diversity
  const experiences = await prisma.experiences.findMany({
    where: {
      status: 'active',
      image_url: { not: null },
      slug: { not: null }, // Only experiences with slugs
    },
    select: {
      id: true,
      title: true,
      description_short: true,
      city: true,
      price_min: true,
      duration_minutes: true,
      tags: true,
      image_url: true,
      slug: true,
      source_url: true,
    },
    orderBy: {
      created_at: 'desc',
    },
    take: limit * 3, // Fetch 3x to ensure variety
  });

  // If no experiences found, return empty array
  if (experiences.length === 0) {
    return [];
  }

  // Group by city to ensure diversity
  const byCityMap = new Map<string, any[]>();

  experiences.forEach((exp) => {
    const city = exp.city;
    if (!byCityMap.has(city)) {
      byCityMap.set(city, []);
    }
    byCityMap.get(city)!.push(exp);
  });

  // Take experiences alternating between cities for diversity
  const diverseExperiences: any[] = [];
  const cities = Array.from(byCityMap.keys());

  // If no cities, return experiences as-is
  if (cities.length === 0) {
    return experiences.slice(0, limit);
  }

  // Shuffle cities to randomize which city we start with
  const shuffledCities = shuffleArray(cities);

  let currentCityIndex = 0;
  let emptyRounds = 0;

  while (diverseExperiences.length < limit && emptyRounds < shuffledCities.length) {
    const city = shuffledCities[currentCityIndex % shuffledCities.length];
    const cityExperiences = byCityMap.get(city) || [];

    if (cityExperiences.length > 0) {
      // Take the first experience from this city
      const exp = cityExperiences.shift();
      if (exp) {
        diverseExperiences.push(exp);
      }
      emptyRounds = 0; // Reset empty rounds counter
    } else {
      emptyRounds++;
    }

    currentCityIndex++;

    // Break if we've cycled through all cities and nothing left
    if (currentCityIndex > shuffledCities.length * limit * 2) {
      break;
    }
  }

  return diverseExperiences;
}

/**
 * Get experiences for "Ideas para Hoy" section
 * Returns diverse experiences from multiple cities
 */
export async function getTonightIdeas(limit: number = 10): Promise<Experience[]> {
  try {
    const experiences = await getDiverseExperiences(limit);
    return experiences.map(transformToFeedExperience);
  } catch (error) {
    console.error('Error fetching tonight ideas:', error);
    return [];
  }
}

/**
 * Get experiences for stress relief / wellness section
 * Filters for wellness-related tags and ensures diversity
 */
export async function getStressReliefExperiences(limit: number = 10): Promise<Experience[]> {
  try {
    // Get diverse experiences
    const allExperiences = await prisma.experiences.findMany({
      where: {
        status: 'active',
        image_url: { not: null },
        slug: { not: null },
      },
      select: {
        id: true,
        title: true,
        description_short: true,
        city: true,
        price_min: true,
        duration_minutes: true,
        tags: true,
        image_url: true,
        slug: true,
        source_url: true,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 100, // Get more to filter
    });

    // Filter for wellness/relaxation experiences based on tags or title
    const wellnessKeywords = [
      'bienestar',
      'wellness',
      'spa',
      'masaje',
      'yoga',
      'meditación',
      'relajación',
      'belleza',
      'autocuidado',
    ];

    const wellnessExperiences = allExperiences.filter((exp) => {
      const tags = Array.isArray(exp.tags) ? exp.tags : [];
      const titleLower = exp.title.toLowerCase();

      return (
        tags.some((tag: any) =>
          wellnessKeywords.some(keyword =>
            typeof tag === 'string' && tag.toLowerCase().includes(keyword)
          )
        ) ||
        wellnessKeywords.some(keyword => titleLower.includes(keyword))
      );
    });

    // Ensure diversity by city
    const byCityMap = new Map<string, any[]>();

    wellnessExperiences.forEach((exp) => {
      const city = exp.city;
      if (!byCityMap.has(city)) {
        byCityMap.set(city, []);
      }
      byCityMap.get(city)!.push(exp);
    });

    const diverseWellness: any[] = [];
    const cities = Array.from(byCityMap.keys());

    // If no cities found, just return the wellness experiences
    if (cities.length === 0) {
      return wellnessExperiences.slice(0, limit).map(transformToFeedExperience);
    }

    const shuffledCities = shuffleArray(cities);

    let currentCityIndex = 0;
    let emptyRounds = 0;

    while (diverseWellness.length < limit && diverseWellness.length < wellnessExperiences.length && emptyRounds < shuffledCities.length) {
      const city = shuffledCities[currentCityIndex % shuffledCities.length];
      const cityExperiences = byCityMap.get(city) || [];

      if (cityExperiences.length > 0) {
        const exp = cityExperiences.shift();
        if (exp) {
          diverseWellness.push(exp);
        }
        emptyRounds = 0; // Reset empty rounds counter
      } else {
        emptyRounds++;
      }

      currentCityIndex++;

      if (currentCityIndex > shuffledCities.length * limit * 2) {
        break;
      }
    }

    // If we don't have enough wellness experiences, fill with general diverse experiences
    if (diverseWellness.length < limit) {
      const remaining = limit - diverseWellness.length;
      const otherExperiences = allExperiences
        .filter(exp => !diverseWellness.includes(exp))
        .slice(0, remaining);
      diverseWellness.push(...otherExperiences);
    }

    return diverseWellness.map(transformToFeedExperience);
  } catch (error) {
    console.error('Error fetching stress relief experiences:', error);
    return [];
  }
}

/**
 * Get all feed experiences at once
 */
export async function getFeedExperiences() {
  const [tonightIdeas, stressRelief] = await Promise.all([
    getTonightIdeas(10),
    getStressReliefExperiences(10),
  ]);

  return {
    tonightIdeas,
    stressRelief,
  };
}
