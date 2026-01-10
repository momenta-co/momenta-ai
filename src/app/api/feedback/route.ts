import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';

/**
 * API Route: POST /api/feedback
 * Accepts and stores user feedback about recommendations
 */

// Validation schema
const feedbackSchema = z.object({
  email: z.string().email('Invalid email format'),
  likedRecommendations: z.boolean(),
  comment: z.string().max(500).optional(),
  recommendationIds: z.array(z.string()),
  messageId: z.string(),
  sessionId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate with Zod
    const validation = feedbackSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { email, likedRecommendations, comment, recommendationIds, messageId } = validation.data;

    // Check for duplicate submission (same email + messageId within last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const existingFeedback = await prisma.beta_feedback.findFirst({
      where: {
        email,
        created_at: {
          gte: tenMinutesAgo,
        },
        comments: {
          contains: messageId, // Store messageId in comments field for now
        },
      },
    });

    if (existingFeedback) {
      return NextResponse.json(
        {
          error: 'Duplicate submission detected',
          message: 'You have already submitted feedback recently',
        },
        { status: 409 }
      );
    }

    // Store comment with messageId prefix for tracking
    const commentWithMetadata = comment
      ? `[MSG:${messageId}][IDs:${recommendationIds.join(',')}] ${comment}`
      : `[MSG:${messageId}][IDs:${recommendationIds.join(',')}]`;

    // Insert feedback into database
    const feedback = await prisma.beta_feedback.create({
      data: {
        email,
        liked_recommendations: likedRecommendations,
        comments: commentWithMetadata,
        user_id: null, // No authentication yet
        recommendation_run_id: null, // Optional linkage
      },
    });

    return NextResponse.json(
      {
        success: true,
        feedbackId: feedback.id,
        message: '¡Gracias por tu feedback! Ya estás participando en el sorteo.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Feedback API] Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to submit feedback. Please try again.',
      },
      { status: 500 }
    );
  }
}
