'use client';

import React from 'react';
import styled from 'styled-components';

const HeaderWrapper = styled.div`
  text-align: center;
  margin-bottom: clamp(3rem, 6vw, 4rem);
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
`;

const Title = styled.h2`
  font-size: clamp(2rem, 4vw, 2.5rem);
  font-weight: 500;
  color: #1F2937;
  font-family: 'Lora', Georgia, serif;
  line-height: 1.3;
  letter-spacing: -0.02em;
  margin: 0 0 0.75rem 0;
`;

const Subtitle = styled.p`
  font-size: clamp(1rem, 1.8vw, 1.125rem);
  color: #6B7280;
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  line-height: 1.6;
  font-weight: 400;
  margin: 0;
`;

interface SectionHeaderProps {
  title: string;
  subtitle: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle }) => {
  return (
    <HeaderWrapper>
      <Title>{title}</Title>
      <Subtitle>{subtitle}</Subtitle>
    </HeaderWrapper>
  );
};

export default SectionHeader;
