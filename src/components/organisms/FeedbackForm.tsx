'use client';

import type { FeedbackData, FeedbackSubmissionResponse } from '@/types/chat';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, ThumbsDown, ThumbsUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import type { UIMessage } from 'ai';

interface FeedbackFormProps {
  messageId: string;
  recommendationIds?: string[];
  userSentiment?: 'positive' | 'negative' | 'neutral';
  onSubmitSuccess?: () => void;
  chatLogs?: UIMessage[];
}

export default function FeedbackForm({
  messageId,
  recommendationIds = [],
  userSentiment,
  onSubmitSuccess,
  chatLogs = [],
}: FeedbackFormProps) {
  // State
  const [fullname, setFullname] = useState('');
  const [instagram, setInstagram] = useState('');
  const [email, setEmail] = useState('');
  const [submittedData, setSubmittedData] = useState<{
    fullname: string;
    email: string;
    instagram?: string;
  } | null>(null);
  const [thumbsSelection, setThumbsSelection] = useState<'up' | 'down' | null>(null);
  const [comment, setComment] = useState('');
  const [submissionState, setSubmissionState] = useState<'idle' | 'loading' | 'success' | 'error' | 'omitted'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [fullnameError, setFullnameError] = useState<string | null>(null);

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
    if (!fullname || fullname.trim().length === 0) {
      setFullnameError('Por favor ingresa tu nombre completo');
      return;
    }

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
      fullname: fullname.trim(),
      instagram: instagram.trim() || undefined,
      likedRecommendations: thumbsSelection === 'up',
      comment: comment.trim() || undefined,
      recommendationIds,
      messageId,
      sessionId: typeof window !== 'undefined' ? window.sessionStorage.getItem('session_id') || undefined : undefined,
      chatLogs: chatLogs.length > 0 ? chatLogs : undefined,
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

        // Save submitted data for WhatsApp message
        setSubmittedData({
          fullname: fullname.trim(),
          email: email.trim(),
          instagram: instagram.trim() || undefined,
        });

        // Call success callback
        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
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

  const handleDismiss = async () => {
    // Send chat logs even when form is omitted
    const feedbackData: FeedbackData = {
      recommendationIds,
      messageId,
      sessionId: typeof window !== 'undefined' ? window.sessionStorage.getItem('session_id') || undefined : undefined,
      chatLogs: chatLogs.length > 0 ? chatLogs : undefined,
      isOmitted: true,
    };

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      });
      // Don't wait for response, just set state
    } catch (error) {
      console.error('[FeedbackForm] Error sending omitted chat logs:', error);
      // Still show omitted state even if API call fails
    }

    setSubmissionState('omitted');
  };

  // WhatsApp link helper
  const getWhatsAppLink = () => {
    const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER || '573112138496';

    let message = 'Hola! Me gustaría continuar con la reserva para estas experiencias:\n\n';

    // Add recommendation IDs
    if (recommendationIds.length > 0) {
      message += `Experiencia${recommendationIds.length > 1 ? 's' : ''} de interés: ${recommendationIds.join(', ')}\n\n`;
    }

    // Add user data if form was submitted
    if (submittedData) {
      message += `Att: ${submittedData.fullname} - ${submittedData.email}`;
    }

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);

    return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  };

  // Success state
  if (submissionState === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative bg-linear-to-br from-success-50 to-secondary-50 backdrop-blur-xl rounded-3xl border border-success-200/60 shadow-2xl shadow-success-700/10 p-8 md:p-10 overflow-hidden"
      >
        {/* Decorative background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.12, scale: 1 }}
            transition={{ duration: 1.2 }}
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-linear-to-br from-success-700 to-secondary-700 blur-3xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.08, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-linear-to-tr from-secondary-700 to-success-700 blur-3xl"
          />
        </div>

        <div className="relative z-10 text-center">
          {/* Success message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <h3 className="font-serif text-2xl md:text-3xl text-neutral-900 mb-4 leading-tight">
              ¡Gracias por toda la info - Nos ayudas un montón!
            </h3>
            <p className="font-sans text-base md:text-lg text-success-800 leading-relaxed">
              Anunciaremos al ganador del giveaway de la experiencia el 21 de enero por IG! Si quieres continuar con la reserva,{' '}
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium hover:text-success-900 transition-colors"
              >
                dale clic a este link
              </a>{' '}
              y Marce te ayudará a confirmarla.
            </p>
          </motion.div>

          {/* Decorative accent line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="w-16 h-1 bg-linear-to-r from-secondary-700 to-secondary-900 mx-auto mt-6 rounded-full"
          />
        </div>
      </motion.div>
    );
  }

  // Omitted state
  if (submissionState === 'omitted') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative bg-linear-to-br from-neutral-50 to-neutral-100 backdrop-blur-xl rounded-3xl border border-neutral-200/60 shadow-2xl shadow-neutral-700/10 p-8 md:p-10 overflow-hidden"
      >
        {/* Decorative background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.12, scale: 1 }}
            transition={{ duration: 1.2 }}
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-linear-to-br from-neutral-700 to-neutral-500 blur-3xl"
          />
        </div>

        <div className="relative z-10 text-center">
          {/* Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <p className="font-sans text-base md:text-lg text-neutral-800 leading-relaxed">
              Si quieres continuar con la reserva,{' '}
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium hover:text-neutral-900 transition-colors"
              >
                dale clic a este link
              </a>{' '}
              y Marce te ayudará a confirmarla.
            </p>
          </motion.div>

          {/* Decorative accent line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="w-16 h-1 bg-linear-to-r from-neutral-700 to-neutral-900 mx-auto mt-6 rounded-full"
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
            className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-linear-to-bl from-primary-700 to-transparent blur-3xl"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.04 }}
            transition={{ duration: 1.5, delay: 0.3 }}
            className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-linear-to-tr from-secondary-700 to-transparent blur-3xl"
          />
        </div>

        {/* Two column layout for desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
          {/* Left Column - Input Fields */}
          <div className="space-y-4">
            {/* Full name input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="space-y-1.5"
            >
              <label
                htmlFor="fullname"
                className="block font-sans text-sm font-medium text-neutral-800 tracking-wide uppercase"
              >
                Nombre completo <span className="text-danger-700">*</span>
              </label>
              <input
                type="text"
                id="fullname"
                value={fullname}
                onChange={(e) => {
                  setFullname(e.target.value);
                  if (fullnameError && e.target.value) {
                    setFullnameError(null);
                  }
                }}
                placeholder="Tu nombre completo"
                className={`
                    w-full bg-neutral-50 border rounded-lg px-3 py-2
                    font-sans text-sm text-neutral-900
                    placeholder:text-neutral-400 placeholder:italic
                    focus:outline-none focus:border-primary-700 focus:bg-white
                    hover:border-neutral-300
                    transition-all duration-300
                    ${fullnameError ? 'border-danger-700 bg-danger-50' : 'border-neutral-200'}
                  `}
                disabled={submissionState === 'loading'}
              />
              <AnimatePresence>
                {fullnameError && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-xs text-danger-700 font-sans"
                  >
                    {fullnameError}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Instagram input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.6 }}
              className="space-y-1.5"
            >
              <label
                htmlFor="instagram"
                className="block font-sans text-sm font-medium text-neutral-800 tracking-wide uppercase"
              >
                Usuario de Instagram{' '}
                <span className="text-neutral-500 font-normal lowercase">(opcional)</span>
              </label>
              <input
                type="text"
                id="instagram"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@usuario"
                className="
                    w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2
                    font-sans text-sm text-neutral-900
                    placeholder:text-neutral-400 placeholder:italic
                    focus:outline-none focus:border-primary-700 focus:bg-white
                    hover:border-neutral-300
                    transition-all duration-300
                  "
                disabled={submissionState === 'loading'}
              />
            </motion.div>

            {/* Email input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="space-y-1.5"
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
                    w-full bg-neutral-50 border rounded-lg px-3 py-2
                    font-sans text-sm text-neutral-900
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
                    className="text-xs text-danger-700 font-sans"
                  >
                    {emailError}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Right Column - Thumbs and Feedback */}
          <div className="flex flex-col gap-6 md:gap-2 max-h-full">
            {/* Thumbs selection */}
            <motion.div
              className='flex-col gap-2 md:flex-row md:justify-between items-center'
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <label className="block font-sans text-sm font-medium text-neutral-800 tracking-wide uppercase mb-4">
                Le atinamos a las recomendaciones? <span className="text-danger-700">*</span>
              </label>
              <div className="flex items-center justify-center gap-4">
                {/* Thumbs Up */}
                <div className="text-center">
                  <motion.button
                    type="button"
                    onClick={() => setThumbsSelection('up')}
                    whileHover={{ scale: 1.08, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                        w-20 h-20 rounded-full flex items-center justify-center cursor-pointer
                        transition-all duration-300 relative overflow-hidden
                        ${thumbsSelection === 'up'
                        ? 'bg-linear-to-br from-secondary-600 to-secondary-800 text-white shadow-xl shadow-secondary-700/40'
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
                        className="absolute inset-0 bg-secondary-400 rounded-full"
                      />
                    )}
                    <ThumbsUp className="w-8 h-8 relative z-10 " strokeWidth={1} />
                  </motion.button>
                </div>

                {/* Thumbs Down */}
                <div className="text-center">
                  <motion.button
                    type="button"
                    onClick={() => setThumbsSelection('down')}
                    whileHover={{ scale: 1.08, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                        w-20 h-20 rounded-full flex items-center justify-center cursor-pointer
                        transition-all duration-300 relative overflow-hidden
                        ${thumbsSelection === 'down'
                        ? 'bg-linear-to-br from-neutral-600 to-neutral-800 text-white shadow-xl shadow-neutral-700/40'
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
                        className="absolute inset-0 bg-neutral-400 rounded-full"
                      />
                    )}
                    <ThumbsDown className="w-8 h-8 relative z-10" strokeWidth={1} />
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Comment textarea */}
            <motion.div
              className="h-full flex flex-col gap-2 md:gap-4 justify-between"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <label
                htmlFor="comment"
                className="block font-sans text-sm font-medium text-neutral-800 tracking-wide uppercase"
              >
                Cualquier feedback adicional que nos ayude a mejorar ❤️{' '}
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
                rows={2}
                className="
                    w-full h-[70%] bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2
                    font-sans text-sm text-neutral-900
                    placeholder:text-neutral-400 placeholder:italic
                    focus:outline-none focus:border-primary-700 focus:bg-white
                    hover:border-neutral-300
                    transition-all duration-300 resize-none
                  "
                disabled={submissionState === 'loading'}
              />
            </motion.div>
          </div>
        </div>

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

        {/* Submit and Omit buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-4 flex justify-between items-center"
        >
          {/* Omit button */}
          <motion.button
            type="button"
            onClick={handleDismiss}
            disabled={submissionState === 'loading'}
            whileHover={{ scale: submissionState === 'loading' ? 1 : 1.02 }}
            whileTap={{ scale: submissionState === 'loading' ? 1 : 0.98 }}
            className={`
                text-neutral-600 rounded-full px-4 py-2
                font-sans text-sm font-medium
                transition-all duration-300
                ${submissionState === 'loading'
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:text-neutral-800 hover:bg-neutral-100'
              }
              `}
          >
            Omitir
          </motion.button>

          {/* Submit button */}
          <motion.button
            type="submit"
            disabled={!fullname || !email || !thumbsSelection || submissionState === 'loading'}
            whileHover={{ scale: !fullname || !email || !thumbsSelection || submissionState === 'loading' ? 1 : 1.02 }}
            whileTap={{ scale: !fullname || !email || !thumbsSelection || submissionState === 'loading' ? 1 : 0.98 }}
            className={`
                bg-primary-700 text-white rounded-full px-5 py-2.5
                font-sans text-lg font-medium tracking-wide
                shadow-lg shadow-primary-700/30
                transition-all duration-300
                flex items-center justify-center gap-3
                ${(!fullname || !email || !thumbsSelection || submissionState === 'loading')
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
      </motion.form>
    </AnimatePresence >
  );
}
