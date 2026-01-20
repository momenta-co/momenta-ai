'use client';

import BetaWelcomeModal from '@/components/organisms/BetaWelcomeModal';
import ExperienceCarousel from '@/components/organisms/ExperienceCarousel';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Chat } from '../templates/Chat';

const BETA_MODAL_KEY = 'momenta_beta_welcome_seen';

interface HeroProps {
  onMessagesChange?: (messageCount: number) => void;
}

export const Hero = ({ onMessagesChange }: HeroProps) => {
  const [messageCount, setMessageCount] = useState(0);
  const [showBetaModal, setShowBetaModal] = useState(false);

  useEffect(() => {
    // Check if user has already seen the modal
    const hasSeenModal = localStorage.getItem(BETA_MODAL_KEY);
    if (!hasSeenModal) {
      setShowBetaModal(true);
    }
  }, []);

  const handleCloseBetaModal = () => {
    localStorage.setItem(BETA_MODAL_KEY, 'true');
    setShowBetaModal(false);
  };

  const handleMessagesChange = (count: number) => {
    setMessageCount(count);
    onMessagesChange?.(count);
  };

  return (
    <>
      {/* Beta Welcome Modal */}
      {showBetaModal && (
        <BetaWelcomeModal onClose={handleCloseBetaModal} />
      )}

      <section className="relative h-dvh flex flex-col bg-neutral-100 pt-16 lg:pt-20 overflow-hidden" style={{ minHeight: '-webkit-fill-available' } as React.CSSProperties}>
        <div className="flex-1 flex items-stretch px-2 lg:px-16 max-w-[1400px] mx-auto w-full h-full py-0 lg:py-8 overflow-hidden">
          <motion.div
            className="flex flex-col lg:flex-row w-full h-full"
            animate={{
              gap: messageCount > 0 ? '0px' : '64px'
            }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Left Column - Chat Interface */}
            <motion.div
              className="flex flex-col h-full w-full max-h-full gap-4"
              animate={{
                flex: messageCount > 0 ? '1 1 100%' : '1 1 50%',
              }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <Chat onMessagesChange={handleMessagesChange} />
            </motion.div>

            {/* Right Column - Featured Experience Carousel */}
            <AnimatePresence mode="wait">
              {messageCount === 0 && (
                <motion.div
                  key="carousel-wrapper"
                  initial={{ opacity: 1, flex: '1 1 50%' }}
                  exit={{ opacity: 0, flex: '0 0 0%' }}
                  transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="overflow-hidden hidden lg:flex rounded-[32px]"
                >
                  <ExperienceCarousel />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>
    </>
  );
}
