'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, ThumbsDown, X, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import type { FeedbackData, FeedbackSubmissionResponse } from '@/types/chat';

interface FeedbackFormProps {
  messageId: string;
  recommendationIds?: string[];
  userSentiment?: 'positive' | 'negative' | 'neutral';
  onSubmitSuccess?: () => void;
}

export default function FeedbackForm({
  messageId,
  recommendationIds = [],
  userSentiment,
  onSubmitSuccess,
}: FeedbackFormProps) {
  // State
  const [email, setEmail] = useState('');
  const [thumbsSelection, setThumbsSelection] = useState<'up' | 'down' | null>(null);
  const [comment, setComment] = useState('');
  const [submissionState, setSubmissionState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Pre-fill thumbs based on user sentiment
  useEffect(() => {
    if (userSentiment === 'positive') {
      setThumbsSelection('up');
    } else if (userSentiment === 'negative') {
      setThumbsSelection('down');
    }
  }, [userSentiment]);

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);

    if (emailError && value) {
      setEmailError(null);
    }
  };

  const handleEmailBlur = () => {
    if (email && !validateEmail(email)) {
      setEmailError('Por favor ingresa un email válido');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!email || !validateEmail(email)) {
      setEmailError('Por favor ingresa un email válido');
      return;
    }

    if (!thumbsSelection) {
      setErrorMessage('Por favor selecciona una opción (👍 o 👎)');
      return;
    }

    setSubmissionState('loading');
    setErrorMessage(null);

    const feedbackData: FeedbackData = {
      email: email.trim(),
      likedRecommendations: thumbsSelection === 'up',
      comment: comment.trim() || undefined,
      recommendationIds,
      messageId,
      sessionId: typeof window !== 'undefined' ? window.sessionStorage.getItem('session_id') || undefined : undefined,
    };

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      });

      const result: FeedbackSubmissionResponse = await response.json();

      if (response.ok && result.success) {
        setSubmissionState('success');

        // Call success callback
        if (onSubmitSuccess) {
          onSubmitSuccess();
        }

        // Auto-hide after 2 seconds
        setTimeout(() => {
          setIsDismissed(true);
        }, 2000);
      } else {
        setSubmissionState('error');
        setErrorMessage(result.error || 'Error al enviar feedback');
      }
    } catch (error) {
      console.error('[FeedbackForm] Submission error:', error);
      setSubmissionState('error');
      setErrorMessage('Error de conexión. Por favor intenta de nuevo.');
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  // Don't render if dismissed
  if (isDismissed) {
    return null;
  }

  // Success state
  if (submissionState === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative bg-gradient-to-br from-success-50 to-secondary-50 backdrop-blur-xl rounded-3xl border border-success-200/60 shadow-2xl shadow-success-700/10 p-8 md:p-10 overflow-hidden"
      >
        {/* Decorative background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.12, scale: 1 }}
            transition={{ duration: 1.2 }}
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-success-700 to-secondary-700 blur-3xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.08, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-gradient-to-tr from-secondary-700 to-success-700 blur-3xl"
          />
        </div>

        <div className="relative z-10 text-center">
          {/* Success icon with sparkle animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
            className="inline-block mb-6 relative"
          >
            <CheckCircle2 className="w-16 h-16 text-success-700 mx-auto" strokeWidth={1.5} />

            {/* Floating sparkles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: [0, Math.cos(i * 60 * Math.PI / 180) * 50],
                  y: [0, Math.sin(i * 60 * Math.PI / 180) * 50],
                }}
                transition={{
                  delay: 0.4 + i * 0.1,
                  duration: 1.2,
                  ease: 'easeOut'
                }}
                className="absolute top-1/2 left-1/2"
              >
                <Sparkles className="w-4 h-4 text-secondary-700" fill="currentColor" />
              </motion.div>
            ))}
          </motion.div>

          {/* Success message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <h3 className="font-serif text-2xl md:text-3xl text-neutral-900 mb-2 leading-tight">
              ¡Gracias!
            </h3>
            <p className="font-sans text-base md:text-lg text-success-800">
              Ya estás participando en el sorteo 🎉
            </p>
          </motion.div>

          {/* Decorative accent line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="w-16 h-1 bg-gradient-to-r from-secondary-700 to-secondary-900 mx-auto mt-6 rounded-full"
          />
        </div>
      </motion.div>
    );
  }

  // Main form
  return (
    <AnimatePresence>
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-neutral-200/60 shadow-2xl shadow-primary-700/10 p-8 md:p-10 overflow-hidden"
      >
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.06 }}
            transition={{ duration: 1.5 }}
            className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-gradient-to-bl from-primary-700 to-transparent blur-3xl"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.04 }}
            transition={{ duration: 1.5, delay: 0.3 }}
            className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-gradient-to-tr from-secondary-700 to-transparent blur-3xl"
          />
        </div>

        <div className="relative z-10">
          {/* Dismiss button */}
          <motion.button
            type="button"
            onClick={handleDismiss}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            className="absolute -top-2 -right-2 text-neutral-400 hover:text-neutral-700 transition-colors p-2 rounded-full hover:bg-neutral-100"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </motion.button>

          {/* Decorative accent line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="w-16 h-1.5 bg-gradient-to-r from-secondary-700 to-secondary-900 rounded-full mb-6"
          />

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mb-8"
          >
            <h3 className="font-serif text-2xl md:text-3xl text-neutral-900 mb-2 leading-tight">
              Información para el sorteo
            </h3>
            <p className="font-sans text-base text-neutral-600 leading-relaxed">
              Completa estos datos para participar
            </p>
          </motion.div>

          {/* Email input */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mb-6 space-y-2"
          >
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
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              placeholder="tu@email.com"
              className={`
                w-full bg-neutral-50 border-2 rounded-xl px-5 py-3.5
                font-sans text-base text-neutral-900
                placeholder:text-neutral-400 placeholder:italic
                focus:outline-none focus:border-primary-700 focus:bg-white
                hover:border-neutral-300
                transition-all duration-300
                ${emailError ? 'border-danger-700 bg-danger-50' : 'border-neutral-200'}
              `}
              disabled={submissionState === 'loading'}
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
          </motion.div>

          {/* Thumbs selection */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mb-8"
          >
            <label className="block font-sans text-sm font-medium text-neutral-800 tracking-wide uppercase mb-4">
              ¿Qué te parecieron las recomendaciones? <span className="text-danger-700">*</span>
            </label>
            <div className="flex items-center justify-center gap-6">
              {/* Thumbs Up */}
              <div className="text-center">
                <motion.button
                  type="button"
                  onClick={() => setThumbsSelection('up')}
                  whileHover={{ scale: 1.08, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    w-24 h-24 rounded-2xl flex items-center justify-center
                    transition-all duration-300 relative overflow-hidden
                    ${thumbsSelection === 'up'
                      ? 'bg-gradient-to-br from-secondary-600 to-secondary-800 text-white shadow-xl shadow-secondary-700/40'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 border-2 border-neutral-200'
                    }
                  `}
                  disabled={submissionState === 'loading'}
                  aria-label="Me gustaron"
                >
                  {thumbsSelection === 'up' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 2.5, opacity: 0 }}
                      transition={{ duration: 0.6 }}
                      className="absolute inset-0 bg-secondary-400 rounded-2xl"
                    />
                  )}
                  <ThumbsUp className="w-10 h-10 relative z-10" strokeWidth={2} />
                </motion.button>
                <p className="text-xs text-neutral-600 mt-3 font-sans">Me gustaron</p>
              </div>

              {/* Thumbs Down */}
              <div className="text-center">
                <motion.button
                  type="button"
                  onClick={() => setThumbsSelection('down')}
                  whileHover={{ scale: 1.08, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    w-24 h-24 rounded-2xl flex items-center justify-center
                    transition-all duration-300 relative overflow-hidden
                    ${thumbsSelection === 'down'
                      ? 'bg-gradient-to-br from-neutral-600 to-neutral-800 text-white shadow-xl shadow-neutral-700/40'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 border-2 border-neutral-200'
                    }
                  `}
                  disabled={submissionState === 'loading'}
                  aria-label="No me gustaron"
                >
                  {thumbsSelection === 'down' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 2.5, opacity: 0 }}
                      transition={{ duration: 0.6 }}
                      className="absolute inset-0 bg-neutral-400 rounded-2xl"
                    />
                  )}
                  <ThumbsDown className="w-10 h-10 relative z-10" strokeWidth={2} />
                </motion.button>
                <p className="text-xs text-neutral-600 mt-3 font-sans">No me gustaron</p>
              </div>
            </div>
          </motion.div>

          {/* Comment textarea */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="mb-6 space-y-2"
          >
            <label
              htmlFor="comment"
              className="block font-sans text-sm font-medium text-neutral-800 tracking-wide uppercase"
            >
              Cuéntanos más{' '}
              <span className="text-neutral-500 font-normal lowercase">(opcional)</span>
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => {
                if (e.target.value.length <= 500) {
                  setComment(e.target.value);
                }
              }}
              placeholder="¿Qué mejorarías? ¿Qué te gustaría ver?"
              rows={4}
              className="
                w-full bg-neutral-50 border-2 border-neutral-200 rounded-xl p-4
                font-sans text-base text-neutral-900
                placeholder:text-neutral-400 placeholder:italic
                focus:outline-none focus:border-primary-700 focus:bg-white
                hover:border-neutral-300
                transition-all duration-300 resize-none
                min-h-[100px] max-h-[200px]
              "
              disabled={submissionState === 'loading'}
            />
            <div className="flex justify-end">
              <span className="text-xs text-neutral-500 font-sans">
                {comment.length}/500
              </span>
            </div>
          </motion.div>

          {/* Error message */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 bg-danger-50 border border-danger-200 rounded-xl p-4"
              >
                <p className="text-sm text-danger-700 font-sans">{errorMessage}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex items-center justify-between gap-4"
          >
            <motion.button
              type="button"
              onClick={handleDismiss}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="
                font-sans text-sm text-neutral-600 hover:text-neutral-800
                transition-colors duration-200 px-4 py-2
              "
              disabled={submissionState === 'loading'}
            >
              Omitir
            </motion.button>

            <motion.button
              type="submit"
              disabled={!email || !thumbsSelection || submissionState === 'loading'}
              whileHover={{ scale: !email || !thumbsSelection || submissionState === 'loading' ? 1 : 1.02 }}
              whileTap={{ scale: !email || !thumbsSelection || submissionState === 'loading' ? 1 : 0.98 }}
              className={`
                bg-primary-700 text-white rounded-full px-8 py-4
                font-sans text-lg font-medium tracking-wide
                shadow-lg shadow-primary-700/30
                transition-all duration-300
                flex items-center justify-center gap-3
                ${(!email || !thumbsSelection || submissionState === 'loading')
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-primary-800 hover:shadow-xl hover:shadow-primary-700/40'
                }
              `}
            >
              {submissionState === 'loading' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <span>Enviar feedback</span>
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                  >
                    →
                  </motion.div>
                </>
              )}
            </motion.button>
          </motion.div>
        </div>
      </motion.form>
    </AnimatePresence>
  );
}
