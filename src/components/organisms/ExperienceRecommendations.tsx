'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import ExperienceCard from '@/components/molecules/ExperienceCard';
import type { RecommendationData } from '@/types/chat';

interface ExperienceRecommendationsProps {
  recommendations: RecommendationData[];
}

const ExperienceRecommendations = memo(function ExperienceRecommendations({ recommendations }: ExperienceRecommendationsProps) {
  // Split recommendations into rows: first 3, then remaining 2
  const firstRow = recommendations.slice(0, 3);
  const secondRow = recommendations.slice(3, 5);

  return (
    <div className="w-full mb-8 mt-8">
      {/* Title for recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h2 className="text-2xl sm:text-3xl font-serif text-neutral-900 mb-2">
          Experiencias perfectas para ti
        </h2>
        <p className="text-sm text-neutral-600 font-light">
          Seleccionadas especialmente por Momenta AI
        </p>
      </motion.div>

      {/* First row - 3 cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
        {firstRow.map((recommendation, index) => (
          <ExperienceCard key={recommendation.url} recommendation={recommendation} index={index} />
        ))}
      </div>

      {/* Second row - 2 cards centered */}
      {secondRow.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="col-start-1 col-span-1 sm:col-start-1">
            {secondRow[0] && (
              <ExperienceCard recommendation={secondRow[0]} index={3} />
            )}
          </div>
          <div className="col-start-2 col-span-1">
            {secondRow[1] && (
              <ExperienceCard recommendation={secondRow[1]} index={4} />
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default ExperienceRecommendations;
