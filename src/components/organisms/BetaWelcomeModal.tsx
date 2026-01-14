'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface BetaWelcomeModalProps {
  onClose: () => void;
}

export default function BetaWelcomeModal({ onClose }: BetaWelcomeModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay for smooth entrance
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // Wait for exit animation before calling onClose
    setTimeout(onClose, 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 pointer-events-auto overflow-hidden">
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

              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 transition-colors z-10"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>

              {/* Content */}
              <div className="relative z-10 text-center">
                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="font-serif text-2xl md:text-3xl text-neutral-900 mb-4 leading-tight"
                >
                  Sé de los primeros en probar nuestra nueva forma de descubrir experiencias
                </motion.h2>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="font-sans text-base text-neutral-600 mb-6 leading-relaxed"
                >
                  Estás entre las primeras personas en usar nuestra herramienta de recomendaciones. Estamos en fase beta y mejorando constantemente. Pruébala, danos tu opinión sincera y entra automáticamente en el giveaway de una experiencia Momenta.
                </motion.p>

                {/* Thanks message with heart */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="font-sans text-base text-neutral-700 mb-8"
                >
                  Gracias por ayudarnos a mejorarla <span className="text-red-500">❤️</span>
                </motion.p>

                {/* CTA Button */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  onClick={handleClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-[#B3D4BC] text-neutral-800 rounded-full px-8 py-3 font-sans text-lg font-medium shadow-lg shadow-[#B3D4BC]/30 hover:bg-[#9fc5aa] hover:shadow-xl transition-all duration-300"
                >
                  ¡Vamos!
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
