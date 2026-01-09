'use client';

import React, { useEffect, useState, memo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { CarouselExperience } from '@/types/chat';

const carouselExperiences: CarouselExperience[] = [
  {
    title: "Taller de pintura",
    description: "Creatividad artística · 2-4 personas · Fin de semana",
    image: "https://d3p3fw3rutb1if.cloudfront.net/photos/f065395e-683c-4686-9213-81ebacd1c014",
  },
  {
    title: "Cena clandestina",
    description: "Experiencia culinaria única · 8-12 personas · Viernes",
    image: "https://d3p3fw3rutb1if.cloudfront.net/photos/d4f65285-17ed-4e65-a2a2-21dddbc09e84",
  },
  {
    title: "Vuelo en parapente",
    description: "Aventura extrema · 1 persona · Día soleado",
    image: "https://d3p3fw3rutb1if.cloudfront.net/photos/9a332c9e-19e3-444a-8249-72c1651f615b",
  },
  {
    title: "Taller de scrapbook",
    description: "Arte y recuerdos · 3-6 personas · Tarde",
    image: "https://d3p3fw3rutb1if.cloudfront.net/photos/59e7ec82-5a94-4cc1-8675-d2c2277544c0",
  },
  {
    title: "Sesión de Spa",
    description: "Relajación total · 2 personas · Sábado",
    image: "https://d3p3fw3rutb1if.cloudfront.net/photos/5d973ac0-5852-4218-a546-23f2043b28d8",
  },
  {
    title: "Taller de pasta fresca",
    description: "Cocina italiana · 4-8 personas · Domingo",
    image: "https://d3p3fw3rutb1if.cloudfront.net/photos/ff6930dc-ad0f-4f54-b281-ca30ea5c2fe4",
  },
];

const ExperienceCarousel = memo(function ExperienceCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselExperiences.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="hidden lg:flex items-center h-full"
    >
      <div className="relative w-full h-full rounded-[32px] overflow-hidden shadow-2xl">
        {/* Carousel Images */}
        {carouselExperiences.map((experience, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: index === currentSlide ? 1 : 0 }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
            className="absolute inset-0"
            style={{ pointerEvents: index === currentSlide ? 'auto' : 'none' }}
          >
            {/* Hero Image */}
            <Image
              src={experience.image}
              alt={experience.title}
              fill
              className="object-cover"
              priority={index === 0}
              unoptimized
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-10 text-white">
              <h2 className="text-[32px] font-serif font-normal mb-4 leading-tight">
                {experience.title}
              </h2>
              <p className="text-base mb-7 opacity-90 font-light">
                {experience.description}
              </p>
              <button className="px-10 py-3.5 bg-primary-700/90 hover:bg-primary-700 backdrop-blur-sm rounded-full text-white font-medium transition-all duration-300 hover:scale-105 text-base">
                Descubrir
              </button>
            </div>
          </motion.div>
        ))}

        {/* Pagination Dots */}
        <div className="absolute bottom-10 right-10 flex gap-2">
          {carouselExperiences.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'bg-white w-8' : 'bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
});

export default ExperienceCarousel;
