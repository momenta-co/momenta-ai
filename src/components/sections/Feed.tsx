'use client';

import React from "react";
import styled from "styled-components";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ExperienceCard } from "@/components/experiences/ExperienceCard";
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

const SectionHeader = styled.div`
  text-align: center;
  margin-bottom: clamp(3rem, 6vw, 4rem);
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
`;

const SectionTitle = styled.h2`
  font-size: clamp(2rem, 4vw, 2.5rem);
  font-weight: 500;
  color: #1F2937;
  font-family: 'Lora', Georgia, serif;
  line-height: 1.3;
  letter-spacing: -0.02em;
  margin: 0 0 0.75rem 0;
`;

const SectionSubtitle = styled.p`
  font-size: clamp(1rem, 1.8vw, 1.125rem);
  color: #6B7280;
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  line-height: 1.6;
  font-weight: 400;
  margin: 0;
`;

const SliderSection = styled.div`
  margin-bottom: clamp(3rem, 6vw, 5rem);

  &:last-child {
    margin-bottom: 0;
  }
`;

const SliderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: clamp(1.5rem, 3vw, 2rem);
  gap: 1rem;
`;

const SliderTitle = styled.h3`
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 500;
  color: #1F2937;
  font-family: 'Lora', Georgia, serif;
  line-height: 1.26;
  letter-spacing: -0.01em;
  margin: 0;

  @media (max-width: 640px) {
    font-size: 1.5rem;
  }
`;

const SliderControls = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-shrink: 0;
`;

const SliderButton = styled.button<{ $disabled?: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid ${props => props.$disabled ? 'rgba(226, 229, 235, 0.5)' : '#E2E5EB'};
  background: ${props => props.$disabled ? '#F7F8FA' : '#FFFFFF'};
  color: ${props => props.$disabled ? '#9CA3AF' : '#1F2937'};
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  opacity: ${props => props.$disabled ? 0.5 : 1};
  box-shadow: ${props => props.$disabled ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.06)'};

  &:hover:not(:disabled) {
    background: #F7F8FA;
    border-color: #1E3A5F;
    color: #1E3A5F;
    transform: scale(1.05);
    box-shadow: 0 4px 6px rgba(30, 58, 95, 0.1);
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
  }
`;

const SliderContainer = styled.div`
  position: relative;
  width: 100%;
`;

const SliderTrack = styled.div`
  display: flex;
  flex-wrap: nowrap;
  gap: clamp(1rem, 2vw, 1.5rem);
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;
  scroll-snap-type: x proximity;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding-bottom: 0.5rem;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const SliderCard = styled.div`
  flex: 0 0 auto;
  width: clamp(280px, 23vw, 320px);
  min-width: 280px;
  scroll-snap-align: start;

  @media (max-width: 1024px) {
    width: 300px;
  }

  @media (max-width: 768px) {
    width: 280px;
  }

  @media (max-width: 640px) {
    width: 260px;
    min-width: 260px;
  }
`;

interface FeedProps {
  tonightIdeas: Experience[];
  stressRelief: Experience[];
}

function HorizontalSlider({
  title,
  items,
  renderCard
}: {
  title: string;
  items: Experience[];
  renderCard: (item: Experience, index: number) => React.ReactNode;
}) {
  const sliderRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  const checkScrollability = React.useCallback(() => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  React.useEffect(() => {
    checkScrollability();
    const slider = sliderRef.current;
    if (!slider) return;

    slider.addEventListener('scroll', checkScrollability);
    window.addEventListener('resize', checkScrollability);

    return () => {
      slider.removeEventListener('scroll', checkScrollability);
      window.removeEventListener('resize', checkScrollability);
    };
  }, [checkScrollability, items]);

  const scrollLeft = () => {
    if (!sliderRef.current) return;
    const scrollAmount = sliderRef.current.clientWidth * 0.85;
    sliderRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  };

  const scrollRight = () => {
    if (!sliderRef.current) return;
    const scrollAmount = sliderRef.current.clientWidth * 0.85;
    sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <SliderSection>
      <SliderHeader>
        <SliderTitle>{title}</SliderTitle>
        <SliderControls>
          <SliderButton
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            $disabled={!canScrollLeft}
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </SliderButton>
          <SliderButton
            onClick={scrollRight}
            disabled={!canScrollRight}
            $disabled={!canScrollRight}
            aria-label="Scroll right"
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </SliderButton>
        </SliderControls>
      </SliderHeader>
      <SliderContainer>
        <SliderTrack ref={sliderRef}>
          {items.map((item, index) => (
            <SliderCard key={item.url || index}>
              {renderCard(item, index)}
            </SliderCard>
          ))}
        </SliderTrack>
      </SliderContainer>
    </SliderSection>
  );
}

export const Feed = ({ tonightIdeas, stressRelief }: FeedProps) => {
  // Show nothing if no experiences
  if (tonightIdeas.length === 0 && stressRelief.length === 0) {
    return null;
  }

  return (
    <FeedWrapper>
      <FeedContainer>
        <SectionHeader>
          <SectionTitle>Experiencias Curadas para Ti</SectionTitle>
          <SectionSubtitle>
            Descubre momentos especiales seleccionados según tus preferencias
          </SectionSubtitle>
        </SectionHeader>

        {tonightIdeas.length > 0 && (
          <HorizontalSlider
            title="Ideas para Hoy"
            items={tonightIdeas}
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