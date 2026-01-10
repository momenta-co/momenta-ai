'use client';

import React from 'react';
import styled from 'styled-components';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SliderButton from '@/components/atoms/SliderButton';

const ControlsWrapper = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-shrink: 0;
`;

interface SliderControlsProps {
  canScrollLeft: boolean;
  canScrollRight: boolean;
  onScrollLeft: () => void;
  onScrollRight: () => void;
}

const SliderControls: React.FC<SliderControlsProps> = ({
  canScrollLeft,
  canScrollRight,
  onScrollLeft,
  onScrollRight
}) => {
  return (
    <ControlsWrapper>
      <SliderButton
        onClick={onScrollLeft}
        disabled={!canScrollLeft}
        ariaLabel="Scroll left"
      >
        <ChevronLeft size={20} strokeWidth={2.5} />
      </SliderButton>
      <SliderButton
        onClick={onScrollRight}
        disabled={!canScrollRight}
        ariaLabel="Scroll right"
      >
        <ChevronRight size={20} strokeWidth={2.5} />
      </SliderButton>
    </ControlsWrapper>
  );
};

export default SliderControls;
