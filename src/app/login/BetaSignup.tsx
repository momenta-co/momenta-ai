'use client';

import type { BetaSignupData, BetaSignupResponse } from '@/types/beta';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Instagram, Loader2, Sparkles } from 'lucide-react';
import React, { useState } from 'react';

export default function BetaSignup() {
  // State
  const [email, setEmail] = useState('');
  const [instagram, setInstagram] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Email validation
  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailError(null);

    if (!email || !validateEmail(email)) {
      setEmailError('Por favor ingresa un email válido');
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

  // Success state UI
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-primary-100/30 to-neutral-100 flex items-center justify-center px-4 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.15, scale: 1 }}
            transition={{ duration: 1.2 }}
            className="absolute top-20 right-20 w-96 h-96 rounded-full bg-gradient-to-br from-secondary-700 to-primary-700 blur-3xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="absolute bottom-20 left-20 w-96 h-96 rounded-full bg-gradient-to-tr from-success-700 to-secondary-700 blur-3xl"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="max-w-2xl w-full text-center relative z-10"
        >
          {/* Success icon with sparkle animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
            className="inline-block mb-8 relative"
          >
            <CheckCircle2 className="w-24 h-24 text-success-700 mx-auto" strokeWidth={1.5} />

            {/* Floating sparkles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: [0, Math.cos(i * 60 * Math.PI / 180) * 60],
                  y: [0, Math.sin(i * 60 * Math.PI / 180) * 60],
                }}
                transition={{
                  delay: 0.4 + i * 0.1,
                  duration: 1.2,
                  ease: 'easeOut'
                }}
                className="absolute top-1/2 left-1/2"
              >
                <Sparkles className="w-5 h-5 text-secondary-700" fill="currentColor" />
              </motion.div>
            ))}
          </motion.div>

          {/* Success headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="font-serif text-5xl md:text-6xl text-neutral-1000 mb-6 leading-tight"
          >
            ¡Bienvenido a<br />
            <span className="text-primary-700">Momenta</span>!
          </motion.h1>

          {/* Success message */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="font-sans text-xl text-neutral-700 leading-relaxed max-w-lg mx-auto"
          >
            Te contactaremos pronto con tu acceso anticipado.
          </motion.p>

          {/* Decorative gold line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="w-24 h-1 bg-gradient-to-r from-secondary-700 to-secondary-900 mx-auto mt-12 rounded-full"
          />
        </motion.div>
      </div>
    );
  }

  // Main form UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-primary-100/20 to-neutral-100 flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.08 }}
          transition={{ duration: 1.5 }}
          className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-gradient-to-bl from-primary-700 to-transparent blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.05 }}
          transition={{ duration: 1.5, delay: 0.3 }}
          className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-secondary-700 to-transparent blur-3xl"
        />
      </div>

      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">
        {/* Left side - Brand message */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="space-y-8"
        >
          {/* Decorative element */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="w-20 h-1.5 bg-gradient-to-r from-secondary-700 to-secondary-900 rounded-full"
          />

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="font-serif text-5xl md:text-6xl lg:text-7xl text-neutral-1000 leading-[1.1] tracking-tight"
          >
            Tu próximo momento{' '}
            <span className="text-primary-700 italic">inolvidable</span>{' '}
            está por comenzar
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="font-sans text-lg md:text-xl text-neutral-700 leading-relaxed max-w-xl"
          >
            Regístrate ahora y sé de los primeros en descubrir experiencias diseñadas para crear momentos que perduran.
          </motion.p>

          {/* Small trust indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="flex items-center gap-3 text-neutral-600"
          >
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-700 to-primary-900 border-2 border-neutral-100" />
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary-700 to-secondary-900 border-2 border-neutral-100" />
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-success-700 to-success-900 border-2 border-neutral-100" />
            </div>
            <p className="font-sans text-sm">
              Únete a la lista exclusiva
            </p>
          </motion.div>
        </motion.div>

        {/* Right side - Form */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <form
            onSubmit={handleSubmit}
            className="bg-white/80 backdrop-blur-xl rounded-3xl border border-neutral-200/60 shadow-2xl shadow-primary-700/10 p-8 md:p-10 space-y-6"
          >
            {/* Email input */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block font-sans text-sm font-medium text-neutral-800 tracking-wide uppercase"
              >
                Tu email <span className="text-danger-700">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                placeholder="tu@email.com"
                className={`
                  w-full bg-neutral-50 border-2 rounded-xl px-5 py-3.5
                  font-sans text-base text-neutral-900
                  placeholder:text-neutral-400 placeholder:italic
                  focus:outline-none focus:border-primary-700 focus:bg-white
                  transition-all duration-300
                  ${emailError ? 'border-danger-700 bg-danger-50' : 'border-neutral-200 hover:border-neutral-300'}
                `}
                disabled={isSubmitting}
              />
              <AnimatePresence>
                {emailError && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm text-danger-700 font-sans"
                  >
                    {emailError}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Instagram input */}
            <div className="space-y-2">
              <label
                htmlFor="instagram"
                className="block font-sans text-sm font-medium text-neutral-800 tracking-wide uppercase"
              >
                Instagram{' '}
                <span className="text-neutral-500 font-normal lowercase">(opcional)</span>
              </label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Instagram className="w-5 h-5 text-neutral-400" />
                </div>
                <input
                  type="text"
                  id="instagram"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@tuusuario"
                  className="
                    w-full bg-neutral-50 border-2 border-neutral-200 rounded-xl pl-14 pr-5 py-3.5
                    font-sans text-base text-neutral-900
                    placeholder:text-neutral-400 placeholder:italic
                    focus:outline-none focus:border-primary-700 focus:bg-white
                    hover:border-neutral-300
                    transition-all duration-300
                  "
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-danger-50 border border-danger-200 rounded-xl p-4"
                >
                  <p className="text-sm text-danger-700 font-sans">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={!email || isSubmitting}
              whileHover={{ scale: !email || isSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: !email || isSubmitting ? 1 : 0.98 }}
              className={`
                w-full bg-primary-700 text-white rounded-full px-8 py-4
                font-sans text-lg font-medium tracking-wide
                shadow-lg shadow-primary-700/30
                transition-all duration-300
                flex items-center justify-center gap-3
                ${(!email || isSubmitting)
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-primary-800 hover:shadow-xl hover:shadow-primary-700/40'
                }
              `}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <span>Reservar mi lugar</span>
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                  >
                    →
                  </motion.div>
                </>
              )}
            </motion.button>

            {/* Small print */}
            <p className="text-center text-xs text-neutral-500 font-sans leading-relaxed pt-2">
              Al registrarte, aceptas recibir actualizaciones sobre el lanzamiento de Momenta.
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
