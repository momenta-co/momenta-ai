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
