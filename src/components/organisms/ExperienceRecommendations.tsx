'use client';

import ExperienceCard from '@/components/molecules/ExperienceCard';
import type { RecommendationData } from '@/types/chat';
import { memo } from 'react';
import HorizontalSlider from './HorizontalSlider';

interface ExperienceRecommendationsProps {
  recommendations: RecommendationData[];
}

export const ExperienceRecommendations = memo(function ExperienceRecommendations({ recommendations }: ExperienceRecommendationsProps) {
  return (
    <div className="mt-4 mb-4">
      <HorizontalSlider
        title=""
        items={recommendations}
        keyExtractor={(rec) => rec.url}
        renderCard={(rec, index) => (
          <ExperienceCard
            recommendation={rec}
            index={index}
          />
        )}
      />
    </div>
  );
});
