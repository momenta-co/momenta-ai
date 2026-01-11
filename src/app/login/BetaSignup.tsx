'use client';

import type { BetaSignupData, BetaSignupResponse } from '@/types/beta';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';
import Image from 'next/image';
import React, { useState } from 'react';

export default function BetaSignup() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !validateEmail(email)) {
      setError('Por favor ingresa un email válido');
      return;
    }

    setIsSubmitting(true);

    const signupData: BetaSignupData = {
      email: email.trim(),
      referralSource: typeof window !== 'undefined' ? window.location.search : undefined,
    };

    try {
      const response = await fetch('/api/beta-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData),
      });

      const result: BetaSignupResponse = await response.json();

      if (response.ok && result.success) {
        setIsSuccess(true);
      } else {
        setError(result.message || 'Ocurrió un error. Intenta de nuevo.');
      }
    } catch (err) {
      console.error('[Beta Signup] Error:', err);
      setError('Error de conexión. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 150 }}
            className="mb-8"
          >
            <CheckCircle2 className="w-16 h-16 text-primary-700 mx-auto" strokeWidth={1} />
          </motion.div>

          <h1 className="font-serif text-5xl md:text-6xl text-primary-700 mb-6">
            ¡Gracias!
          </h1>

          <div className="w-16 h-px bg-secondary-700 mx-auto mb-6" />

          <p className="font-sans text-base text-neutral-500">
            Te contactaremos pronto con tu acceso anticipado.
          </p>
        </motion.div>
      </div>
    );
  }

  // Main form - Simple grid layout
  return (
    <div className="min-h-screen bg-white flex flex-col px-8 py-6">
      {/* Logo */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <Image
          src="https://images.squarespace-cdn.com/content/v1/6437ebd38df658408b0c18cf/d271814a-2a2f-4867-addd-320040f84a22/6Asset+3%403xh.png?format=1500w"
          alt="Momenta"
          width={120}
          height={35}
          className="h-5 w-auto mx-auto opacity-60"
          priority
          unoptimized
        />
      </motion.header>

      {/* Main Content - positioned higher */}
      <main className="flex-1 flex flex-col items-center text-center pt-[8vh] md:pt-[10vh]">
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="font-serif text-primary-700 text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-[1.1] tracking-tight"
        >
          Tu próximo momento<br />
          <span className="italic">inolvidable</span>
        </motion.h1>

        {/* Line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="w-12 h-px bg-secondary-700 mt-10 mb-6"
        />

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="font-sans text-neutral-500 text-base md:text-lg max-w-md"
        >
          Bienvenido al club de personas que viven experiencias inolvidables.
        </motion.p>

        {/* CTA + Form - closer to subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-16"
        >
          <p className="font-sans text-sm text-neutral-600 mb-1">
            ¿Quieres ser de los primeros en acceder?
          </p>
          <p className="font-sans text-sm text-neutral-400 mb-4">
            Déjanos tu email, te avisaremos cuando estemos listos.
          </p>

          <form onSubmit={handleSubmit} className="inline-flex">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Tu email"
              className="
                w-44 md:w-52 bg-neutral-100 border border-neutral-200 border-r-0
                px-4 py-2.5
                font-sans text-sm text-neutral-800
                placeholder:text-neutral-400
                focus:outline-none focus:bg-white
              "
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={!email || isSubmitting}
              className={`
                bg-neutral-800 text-white px-5 py-2.5
                font-sans text-xs font-medium tracking-widest uppercase
                transition-colors
                ${(!email || isSubmitting)
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:bg-neutral-900'
                }
              `}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Notificarme'
              )}
            </button>
          </form>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-red-500 mt-2"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
}
