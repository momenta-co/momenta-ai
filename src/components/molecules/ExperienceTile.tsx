'use client';
import React from 'react';
import styled from 'styled-components';

const TileWrapper = styled.div<{ $isText?: boolean }>`
  width: 100%;
  height: 100%;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  background: ${props => props.$isText
    ? 'linear-gradient(135deg, rgba(123, 184, 134, 0.08) 0%, rgba(146, 168, 137, 0.12) 100%)'
    : 'transparent'};
  border: ${props => props.$isText ? '1px solid rgba(123, 184, 134, 0.15)' : 'none'};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${props => props.$isText ? '1.25rem' : '0'};
  position: relative;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
    background: ${props => props.$isText
    ? 'linear-gradient(135deg, rgba(123, 184, 134, 0.12) 0%, rgba(146, 168, 137, 0.18) 100%)'
    : 'transparent'};
    border-color: ${props => props.$isText ? 'rgba(123, 184, 134, 0.25)' : 'transparent'};
  }

  ${props => props.$isText && `
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(
        circle at 80% 20%,
        rgba(123, 184, 134, 0.06) 0%,
        transparent 50%
      );
      pointer-events: none;
    }
  `}
`;

const TileImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ImagePlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(123, 184, 134, 0.15) 0%,
    rgba(146, 168, 137, 0.2) 25%,
    rgba(123, 184, 134, 0.15) 50%,
    rgba(105, 165, 118, 0.1) 75%,
    rgba(146, 168, 137, 0.2) 100%
  );
  background-size: 200% 200%;
  animation: gradientShift 8s ease infinite;

  @keyframes gradientShift {
    0%, 100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }
`;

const TextContent = styled.p`
  font-family: 'Merriweather', Georgia, serif;
  font-size: clamp(0.8rem, 2.2vw, 0.95rem);
  color: #222A11;
  text-align: center;
  line-height: 1.45;
  margin: 0;
  font-weight: 500;
  letter-spacing: -0.01em;
  word-wrap: break-word;
  hyphens: auto;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    font-size: clamp(0.7rem, 3vw, 0.85rem);
    line-height: 1.35;
  }
`;

interface ExperienceTileProps {
  imageUrl?: string;
  alt?: string;
  onClick?: () => void;
  label?: string;
}

export const ExperienceTile: React.FC<ExperienceTileProps> = ({
  imageUrl,
  alt = 'Experience',
  onClick,
  label
}) => {
  const isTextTile = Boolean(!imageUrl && label);

  return (
    <TileWrapper onClick={onClick} $isText={isTextTile}>
      {imageUrl ? (
        <TileImage src={imageUrl} alt={alt} />
      ) : label ? (
        <TextContent>{label}</TextContent>
      ) : (
        <ImagePlaceholder />
      )}
    </TileWrapper>
  );
};
