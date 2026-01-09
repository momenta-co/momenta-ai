'use client';

import React from 'react';
import styled from 'styled-components';
import SliderControls from '@/components/molecules/SliderControls';

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

interface HorizontalSliderProps<T> {
  title: string;
  items: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string | number;
}

function HorizontalSlider<T>({
  title,
  items,
  renderCard,
  keyExtractor = (_, index) => index
}: HorizontalSliderProps<T>) {
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
        <SliderControls
          canScrollLeft={canScrollLeft}
          canScrollRight={canScrollRight}
          onScrollLeft={scrollLeft}
          onScrollRight={scrollRight}
        />
      </SliderHeader>
      <SliderContainer>
        <SliderTrack ref={sliderRef}>
          {items.map((item, index) => (
            <SliderCard key={keyExtractor(item, index)}>
              {renderCard(item, index)}
            </SliderCard>
          ))}
        </SliderTrack>
      </SliderContainer>
    </SliderSection>
  );
}

export default HorizontalSlider;
