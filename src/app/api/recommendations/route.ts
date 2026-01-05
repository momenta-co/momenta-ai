import { NextRequest, NextResponse } from 'next/server';
import { recommendationRequestSchema } from '@/lib/intelligence/schema';
import { generateAIRecommendations, getModelName } from '@/lib/intelligence/ai-service';
import type { RecommendationResponse } from '@/lib/intelligence/types';
import experiencesData from '../../../../data/experiences.json';

/**
 * API Route: POST /api/recommendations
 * Returns personalized experience recommendations based on user context
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate request body with Zod
    const validation = recommendationRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { userContext } = validation.data;
    const { experiencesPool } = experiencesData;

    // Generate recommendations using AI (with automatic fallback)
    const recommendations = await generateAIRecommendations(
      userContext,
      experiencesPool
    );

    // Build response with metadata
    const response: RecommendationResponse = {
      recommendations,
      meta: {
        model: getModelName(),
        promptVersion: process.env.PROMPT_VERSION || 'v0.1',
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error in recommendations API:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Optional: Add OPTIONS handler for CORS if needed
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { status: 200 });
}
