import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';

/**
 * API Route: POST /api/beta-signup
 * Accepts email and Instagram handle for beta access waitlist
 */

// Validation schema
const signupSchema = z.object({
  email: z.string().email('Email inválido'),
  instagramHandle: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const cleaned = val.trim().replace(/^@/, '');
        return !cleaned || /^[a-zA-Z0-9._]{1,30}$/.test(cleaned);
      },
      { message: 'Usuario de Instagram inválido' }
    )
    .transform((val) => {
      if (!val) return null;
      // Remove @ if user includes it, normalize
      const cleaned = val.trim().replace(/^@/, '');
      return cleaned || null;
    }),
  referralSource: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate with Zod
    const validation = signupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { email, instagramHandle, referralSource, metadata } = validation.data;

    // Check for duplicate email (within last 24 hours to prevent spam)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingSignup = await prisma.beta_signups.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        created_at: {
          gte: oneDayAgo,
        },
      },
    });

    if (existingSignup) {
      return NextResponse.json(
        {
          error: 'Ya estás registrado',
          message: 'Este email ya fue registrado. Te contactaremos pronto.',
        },
        { status: 409 }
      );
    }

    // Insert signup into database
    const signup = await prisma.beta_signups.create({
      data: {
        email: email.toLowerCase().trim(),
        instagram_handle: instagramHandle,
        referral_source: referralSource || null,
        metadata: metadata ? (metadata as any) : {},
      },
    });

    return NextResponse.json(
      {
        success: true,
        signupId: signup.id,
        message: '¡Bienvenido a Momenta! Te contactaremos pronto.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Beta Signup API] Error:', error);

    return NextResponse.json(
      {
        error: 'Error del servidor',
        message: 'No pudimos procesar tu registro. Por favor intenta de nuevo.',
      },
      { status: 500 }
    );
  }
}
