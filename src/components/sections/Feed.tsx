'use client';

import React from "react";
import styled from "styled-components";
import { ExperienceCard } from "@/components/experiences/ExperienceCard";
import SectionHeader from "@/components/molecules/SectionHeader";
import HorizontalSlider from "@/components/organisms/HorizontalSlider";
import type { Experience } from "@/types/experience";

const FeedWrapper = styled.section`
  padding: clamp(4rem, 8vw, 6rem) 0;
  background: #FFFFFF;
  width: 100%;
`;

const FeedContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 clamp(1rem, 4vw, 4rem);
`;

interface FeedProps {
  tonightIdeas: Experience[];
  stressRelief: Experience[];
}

export const Feed = ({ tonightIdeas, stressRelief }: FeedProps) => {
  // Show nothing if no experiences
  if (tonightIdeas.length === 0 && stressRelief.length === 0) {
    return null;
  }

  return (
    <FeedWrapper>
      <FeedContainer>
        <SectionHeader
          title="Experiencias Curadas para Ti"
          subtitle="Descubre momentos especiales seleccionados según tus preferencias"
        />

        {tonightIdeas.length > 0 && (
          <HorizontalSlider
            title="Ideas para Hoy"
            items={tonightIdeas}
            keyExtractor={(exp) => exp.id}
            renderCard={(exp) => (
              <ExperienceCard
                experience={exp}
              />
            )}
          />
        )}

        {stressRelief.length > 0 && (
          <HorizontalSlider
            title="Usualmente disfrutas de esto cuando estás estresado"
            items={stressRelief}
            keyExtractor={(exp) => exp.id}
            renderCard={(exp) => (
              <ExperienceCard
                experience={exp}
              />
            )}
          />
        )}
      </FeedContainer>
    </FeedWrapper>
  );
};