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

  // Calculate price from min/max
  const price = dbExp.price_min
    ? {
        amount: dbExp.price_min.toString(),
        currency: 'COP',
        unit: 'por persona',
      }
    : null;

  return {
    id: dbExp.id,
    title: dbExp.title,
    description: dbExp.description_short || '',
    url: `https://www.momentaboutique.com/experiencias/${dbExp.id}`, // Generate URL
    image: dbExp.image_url || '',
    categories: tags,
    price,
    duration: formatDuration(dbExp.duration_minutes),
    minPeople: null, // Not in database schema
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
 * Fetch experiences by city
 * @param city - City name (e.g., "Bogotá", "Medellín")
 * @returns Array of Experience objects for that city
 */
export async function getExperiencesByCity(city: string): Promise<Experience[]> {
  try {
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
