'use client';

import React from 'react';
import styled from 'styled-components';

const StyledButton = styled.button<{ $disabled?: boolean }>`
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

interface SliderButtonProps {
  onClick: () => void;
  disabled?: boolean;
  ariaLabel: string;
  children: React.ReactNode;
}

const SliderButton: React.FC<SliderButtonProps> = ({
  onClick,
  disabled = false,
  ariaLabel,
  children
}) => {
  return (
    <StyledButton
      onClick={onClick}
      disabled={disabled}
      $disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </StyledButton>
  );
};

export default SliderButton;
