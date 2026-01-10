'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, ThumbsDown, X, CheckCircle2, Loader2 } from 'lucide-react';
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="bg-success-700/10 backdrop-blur-sm rounded-3xl border border-success-700/30 p-6"
      >
        <div className="flex items-center justify-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-success-700" />
          <p className="font-serif text-lg text-success-900">
            ¡Gracias! Ya estás participando en el sorteo 🎉
          </p>
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
        className="relative bg-white/90 backdrop-blur-sm rounded-3xl border border-neutral-200/60 shadow-lg p-6"
      >
        {/* Dismiss button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <h3 className="font-serif text-lg text-neutral-900 mb-1">
            📧 Información para el sorteo
          </h3>
          <p className="font-sans text-sm text-neutral-600">
            Completa estos datos para participar
          </p>
        </div>

        {/* Email input */}
        <div className="mb-4">
          <label htmlFor="email" className="block font-sans text-sm text-neutral-700 mb-2">
            Email <span className="text-danger-700">*</span>
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={handleEmailChange}
            onBlur={handleEmailBlur}
            placeholder="tu@email.com"
            className={`
              w-full bg-neutral-100 border rounded-xl px-4 py-2.5
              font-sans text-base text-neutral-900
              placeholder:text-neutral-500 placeholder:italic placeholder:text-sm
              focus:outline-none focus:ring-2 focus:ring-primary-700/40
              transition-all duration-200
              ${emailError ? 'border-danger-700 ring-2 ring-danger-700/20' : 'border-neutral-300'}
            `}
            disabled={submissionState === 'loading'}
          />
          {emailError && (
            <p className="mt-1.5 text-sm text-danger-700">{emailError}</p>
          )}
        </div>

        {/* Thumbs selection */}
        <div className="mb-4">
          <label className="block font-sans text-sm text-neutral-700 mb-3">
            ¿Qué te parecieron las recomendaciones? <span className="text-danger-700">*</span>
          </label>
          <div className="flex items-center justify-center gap-4">
            {/* Thumbs Up */}
            <motion.button
              type="button"
              onClick={() => setThumbsSelection('up')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`
                w-20 h-20 rounded-full flex items-center justify-center
                transition-all duration-300
                ${thumbsSelection === 'up'
                  ? 'bg-secondary-700 text-white shadow-lg shadow-secondary-700/30 scale-105'
                  : 'bg-neutral-200/80 text-neutral-600 hover:bg-neutral-300/80'
                }
              `}
              disabled={submissionState === 'loading'}
              aria-label="Me gustaron"
            >
              <ThumbsUp className="w-8 h-8" strokeWidth={2} />
            </motion.button>

            {/* Thumbs Down */}
            <motion.button
              type="button"
              onClick={() => setThumbsSelection('down')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`
                w-20 h-20 rounded-full flex items-center justify-center
                transition-all duration-300
                ${thumbsSelection === 'down'
                  ? 'bg-neutral-700 text-white shadow-lg shadow-neutral-700/30 scale-105'
                  : 'bg-neutral-200/80 text-neutral-600 hover:bg-neutral-300/80'
                }
              `}
              disabled={submissionState === 'loading'}
              aria-label="No me gustaron"
            >
              <ThumbsDown className="w-8 h-8" strokeWidth={2} />
            </motion.button>
          </div>
          <div className="flex items-center justify-center gap-8 mt-2">
            <span className="text-xs text-neutral-600">Me gustaron</span>
            <span className="text-xs text-neutral-600">No me gustaron</span>
          </div>
        </div>

        {/* Comment textarea */}
        <div className="mb-5">
          <label htmlFor="comment" className="block font-sans text-sm text-neutral-700 mb-2">
            Cuéntanos más (opcional)
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
            rows={3}
            className="
              w-full bg-neutral-100 border border-neutral-300 rounded-xl p-3
              font-sans text-base text-neutral-900
              placeholder:text-neutral-500 placeholder:italic placeholder:text-sm
              focus:outline-none focus:ring-2 focus:ring-primary-700/40
              transition-all duration-200 resize-none
              min-h-[80px] max-h-[200px]
            "
            disabled={submissionState === 'loading'}
          />
          <div className="flex justify-end mt-1">
            <span className="text-xs text-neutral-500">
              {comment.length}/500
            </span>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 bg-danger-100 border border-danger-700/30 rounded-xl p-3">
            <p className="text-sm text-danger-700">{errorMessage}</p>
          </div>
        )}

        {/* Submit button */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleDismiss}
            className="
              font-sans text-sm text-neutral-600 hover:text-neutral-800
              transition-colors duration-200
            "
            disabled={submissionState === 'loading'}
          >
            Omitir
          </button>

          <motion.button
            type="submit"
            disabled={!email || !thumbsSelection || submissionState === 'loading'}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            className={`
              bg-primary-700 text-white rounded-full px-6 py-2.5
              font-sans text-base font-medium
              transition-all duration-300
              flex items-center gap-2
              ${(!email || !thumbsSelection || submissionState === 'loading')
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-primary-800 shadow-md hover:shadow-lg'
              }
            `}
          >
            {submissionState === 'loading' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar'
            )}
          </motion.button>
        </div>
      </motion.form>
    </AnimatePresence>
  );
}
