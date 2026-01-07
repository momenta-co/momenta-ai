'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useMotionValue, useTransform, AnimatePresence, PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight, Heart, Clock, Users, MapPin } from 'lucide-react';
import experiencesData from '@/data/experiences.json';
import type { Experience } from '@/types/experience';

// Get 5 experiences for testing
const getTestExperiences = (): Experience[] => {
  const allExperiences = experiencesData.experiencias as Experience[];
  return allExperiences.slice(0, 5);
};

function StackedCarousel({ experiences }: { experiences: Experience[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<'left' | 'right'>('left');

  // Motion values for drag - minimal rotation for clean look
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-2, 2]);

  const goToNext = () => {
    setExitDirection('left');
    setCurrentIndex(prev => (prev + 1) % experiences.length); // Loop to start
  };

  const goToPrev = () => {
    setExitDirection('right');
    setCurrentIndex(prev => (prev - 1 + experiences.length) % experiences.length); // Loop to end
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    if (offset < -threshold || velocity < -500) {
      goToNext();
    } else if (offset > threshold || velocity > 500) {
      goToPrev();
    }
  };

  const formatPrice = (price: Experience['price']) => {
    if (!price) return 'Consultar precio';
    const amount = parseInt(price.amount).toLocaleString('es-CO');
    return `$${amount} COP`;
  };

  // Get visible cards (current + next 2 for stacking effect) with infinite loop support
  const getVisibleCards = () => {
    const cards = [];
    for (let i = 0; i < 3; i++) {
      const index = (currentIndex + i) % experiences.length;
      cards.push({ experience: experiences[index], index, stackPosition: i });
    }
    return cards;
  };
  const visibleCards = getVisibleCards();

  return (
    <div className="relative w-full mb-4">
      {/* Stacked Cards Container */}
      <div
        className="relative h-[440px] w-full max-w-[320px] mx-auto"
        style={{ marginBottom: '80px', perspective: '1000px' }}
      >
        <AnimatePresence mode="popLayout">
          {visibleCards.map(({ experience, index, stackPosition }) => {
            const isTop = stackPosition === 0;

            return (
              <motion.div
                key={experience.url}
                className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
                style={{
                  x: isTop ? x : 0,
                  rotate: isTop ? rotate : 0,
                  zIndex: 10 - stackPosition,
                }}
                initial={{
                  scale: 1,
                  y: 0,
                  opacity: 0,
                }}
                animate={{
                  scale: 1,
                  y: 0,
                  opacity: 1,
                }}
                exit={{
                  x: exitDirection === 'left' ? -320 : 320,
                  rotate: exitDirection === 'left' ? -3 : 3,
                  opacity: 0,
                  scale: 0.98,
                }}
                transition={{
                  duration: 0.3,
                  ease: [0.32, 0.72, 0, 1],
                }}
                drag={isTop ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.4}
                onDragEnd={isTop ? handleDragEnd : undefined}
                whileDrag={{ cursor: 'grabbing' }}
              >
                <motion.div
                  className="w-full h-full bg-white rounded-2xl overflow-hidden border border-neutral-200"
                  style={{
                    boxShadow: isTop
                      ? '0 20px 40px -12px rgba(0, 0, 0, 0.15)'
                      : '0 8px 20px -5px rgba(0, 0, 0, 0.08)',
                  }}
                  whileHover={isTop ? { scale: 1.01 } : {}}
                  transition={{ duration: 0.2 }}
                >
                  {/* Image */}
                  <div className="relative h-[220px] overflow-hidden">
                    <Image
                      src={experience.image}
                      alt={experience.title}
                      fill
                      className="object-cover"
                      unoptimized
                      draggable={false}
                    />
                    <button
                      className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Heart className="w-4 h-4 text-neutral-700" strokeWidth={1.5} />
                    </button>
                    {/* Card counter */}
                    <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs">
                      {index + 1} / {experiences.length}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-serif text-xl text-neutral-1000 line-clamp-2 mb-3">
                      {experience.title}
                    </h3>

                    <div className="flex flex-wrap gap-3 mb-4">
                      {experience.duration && (
                        <span className="flex items-center gap-1.5 text-sm text-neutral-700">
                          <Clock className="w-4 h-4" />
                          {experience.duration}
                        </span>
                      )}
                      {experience.min_people && (
                        <span className="flex items-center gap-1.5 text-sm text-neutral-700">
                          <Users className="w-4 h-4" />
                          Min. {experience.min_people}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 text-sm text-neutral-700">
                        <MapPin className="w-4 h-4" />
                        {experience.location}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-primary-700 font-semibold text-lg">
                        {formatPrice(experience.price)}
                      </span>
                      <Link
                        href={experience.url}
                        target="_blank"
                        className="px-4 py-2 bg-primary-700 text-white text-sm font-medium rounded-lg hover:bg-primary-800 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Ver más
                      </Link>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <motion.button
          onClick={goToPrev}
          className="w-10 h-10 rounded-full bg-white border border-neutral-300 flex items-center justify-center hover:bg-neutral-100 transition-colors shadow-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeft className="w-5 h-5 text-neutral-700" />
        </motion.button>

        {/* Dots indicator */}
        <div className="flex gap-2">
          {experiences.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => {
                setExitDirection(index > currentIndex ? 'left' : 'right');
                setCurrentIndex(index);
              }}
              className="h-2 rounded-full transition-colors"
              initial={false}
              animate={{
                width: index === currentIndex ? 24 : 8,
                backgroundColor: index === currentIndex ? '#4a7c59' : '#d1d5db',
              }}
              whileHover={{ scale: 1.2 }}
              transition={{ duration: 0.2 }}
            />
          ))}
        </div>

        <motion.button
          onClick={goToNext}
          className="w-10 h-10 rounded-full bg-white border border-neutral-300 flex items-center justify-center hover:bg-neutral-100 transition-colors shadow-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronRight className="w-5 h-5 text-neutral-700" />
        </motion.button>
      </div>
    </div>
  );
}

export default function CarouselTestPage() {
  const experiences = getTestExperiences();

  return (
    <div className="min-h-screen bg-neutral-100 pt-32 pb-16">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-serif text-center mb-4">Stacked Carousel Test</h1>
        <p className="text-center text-neutral-700 mb-12">
          Prueba del componente de carrusel apilado con Framer Motion
        </p>

        <StackedCarousel experiences={experiences} />
      </div>
    </div>
  );
}
