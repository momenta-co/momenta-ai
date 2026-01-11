'use client';

import type { BetaSignupData, BetaSignupResponse } from '@/types/beta';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Instagram, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import React, { useState } from 'react';

export default function BetaSignup() {
  const [email, setEmail] = useState('');
  const [instagram, setInstagram] = useState('');
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
      instagramHandle: instagram.trim() || undefined,
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
      <div className="min-h-screen bg-white flex flex-col px-8 py-6">
        {/* Logo */}
        <motion.header
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <Link href="/">
            <Image
              src="https://images.squarespace-cdn.com/content/v1/6437ebd38df658408b0c18cf/d271814a-2a2f-4867-addd-320040f84a22/6Asset+3%403xh.png?format=1500w"
              alt="Momenta"
              width={160}
              height={45}
              className="h-6 md:h-8 w-auto mx-auto transition-opacity duration-300 hover:opacity-80"
              priority
              unoptimized
            />
          </Link>
        </motion.header>

        {/* Success Content */}
        <main className="flex-1 flex items-center justify-center">
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
        </main>
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
        <Link href="/">
          <Image
            src="https://images.squarespace-cdn.com/content/v1/6437ebd38df658408b0c18cf/d271814a-2a2f-4867-addd-320040f84a22/6Asset+3%403xh.png?format=1500w"
            alt="Momenta"
            width={160}
            height={45}
            className="h-6 md:h-8 w-auto mx-auto transition-opacity duration-300 hover:opacity-80"
            priority
            unoptimized
          />
        </Link>
      </motion.header>

      {/* Main Content - positioned higher */}
      <main className="flex-1 flex flex-col items-center text-center pt-[8vh] md:pt-[10vh]">
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="font-serif text-neutral-900 text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-[1.1] tracking-tight"
        >
          Tu próximo momento<br />
          <span className="italic text-primary-700">inolvidable</span>
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
          className="font-sans text-neutral-900 text-base md:text-lg max-w-md font-bold"
        >
          Bienvenido al club de personas que viven experiencias inolvidables.
        </motion.p>

        {/* Form - closer to subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-16 w-full max-w-md"
        >

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block font-sans text-xs tracking-widest uppercase text-neutral-500 mb-2">
                Tu email <span className="text-secondary-700">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Mail className="w-4 h-4 text-neutral-300" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="tu@email.com"
                  className="
                    w-full bg-neutral-100 border-0 rounded-md
                    pl-11 pr-4 py-3
                    font-sans text-sm text-neutral-800
                    placeholder:text-neutral-400 placeholder:italic
                    focus:outline-none focus:ring-2 focus:ring-primary-700/20
                  "
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Instagram */}
            <div>
              <label className="block font-sans text-xs tracking-widest uppercase text-neutral-500 mb-2">
                Instagram <span className="font-normal normal-case tracking-normal text-neutral-400">(opcional)</span>
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Instagram className="w-4 h-4 text-neutral-300" />
                </div>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@usuario"
                  className="
                    w-full bg-neutral-100 border-0 rounded-md
                    pl-11 pr-4 py-3
                    font-sans text-sm text-neutral-800
                    placeholder:text-neutral-400 placeholder:italic
                    focus:outline-none focus:ring-2 focus:ring-primary-700/20
                  "
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-red-500"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!email || isSubmitting}
              className="
                w-full text-white rounded-full
                px-6 py-4 mt-2
                font-sans text-sm font-medium tracking-widest uppercase
                transition-colors
                flex items-center justify-center gap-2
                hover:opacity-90
                disabled:cursor-not-allowed
              "
              style={{ backgroundColor: '#1E3A5F' }}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Únete a la Waiting List'
              )}
            </button>

            {/* Terms */}
            <p className="text-xs text-neutral-400 text-center pt-2">
              Al registrarte, aceptas recibir actualizaciones sobre el lanzamiento de Momenta.
            </p>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
