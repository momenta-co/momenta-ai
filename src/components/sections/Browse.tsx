'use client';
import React from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';

const BrowseContentWrapper = styled.div`
  position: relative;
  z-index: 2;
  max-width: 600px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  animation: fadeIn 0.8s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const BrowseFormSection = styled.section`
  position: relative;
  padding: clamp(4rem, 8vw, 6rem) 0;
  margin: 0 0 4rem 0;
  background: #faf9f6;
  border-radius: 0;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    padding: clamp(3rem, 6vw, 4rem) 0;
    min-height: 400px;
  }
`;

const BrowseSideImagesContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
`;

const BrowseImageTile = styled.div<{ $position: 'left' | 'right'; $index: number }>`
  position: absolute;
  width: clamp(120px, 15vw, 180px);
  height: clamp(120px, 15vw, 180px);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  animation: floatTile 6s ease-in-out infinite;
  animation-delay: ${props => props.$index * 0.5}s;
  opacity: 0.85;

  @keyframes floatTile {
    0%, 100% {
      transform: translateY(0) rotate(0deg);
    }
    50% {
      transform: translateY(-20px) rotate(2deg);
    }
  }

  ${props => {
    if (props.$position === 'left') {
      const positions = [
        { top: '10%', left: '5%' },
        { top: '60%', left: '8%' },
      ];
      return `
        top: ${positions[props.$index]?.top || '10%'};
        left: ${positions[props.$index]?.left || '5%'};
      `;
    } else {
      const positions = [
        { top: '15%', right: '5%' },
        { top: '45%', right: '8%' },
        { top: '75%', right: '6%' },
      ];
      return `
        top: ${positions[props.$index]?.top || '15%'};
        right: ${positions[props.$index]?.right || '5%'};
      `;
    }
  }}

  @media (max-width: 768px) {
    display: none; /* Hide side images on mobile for cleaner layout */
  }
`;
const BrowseImagePlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(232, 197, 71, 0.15) 0%,
    rgba(240, 214, 117, 0.2) 25%,
    rgba(123, 167, 204, 0.15) 50%,
    rgba(232, 197, 71, 0.1) 75%,
    rgba(123, 167, 204, 0.2) 100%
  );
  background-size: 200% 200%;
  animation: gradientShift 8s ease infinite;
  position: relative;

  @keyframes gradientShift {
    0%, 100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image:
      radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(255, 255, 255, 0.03) 2px,
        rgba(255, 255, 255, 0.03) 4px
      );
    pointer-events: none;
  }
`;

const BrowseImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const BrowseSectionTitle = styled.h3`
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  font-weight: 500;
  color: #1a1a1a;
  margin: 0;
  font-family: 'Merriweather', Georgia, serif;
  line-height: 1.3;
  letter-spacing: -0.02em;
  text-align: center;
`;

const BrowseSectionSubtitle = styled.p`
  font-size: clamp(1rem, 1.8vw, 1.125rem);
  color: #666666;
  margin: 0;
  font-family: 'Merriweather', Georgia, serif;
  line-height: 1.6;
  font-weight: 400;
  text-align: center;
`;

const BrowseForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 700px;
  margin: 0;
  width: 100%;
  box-sizing: border-box;
  padding-top: 0.5rem;
`;

const BrowseFormFields = styled.div`
  display: flex;
  align-items: flex-end;
  gap: clamp(0.75rem, 1vw, 1rem);
  flex-wrap: wrap;
  width: 100%;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const BrowseButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: 0.5rem;
`;

const FormField = styled.div`
  flex: 1 1 auto;
  min-width: min(150px, 100%);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-sizing: border-box;
  justify-content: flex-end;
`;

const FormLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #1a1a1a;
  font-family: 'Merriweather', Georgia, serif;
  letter-spacing: -0.005em;
`;

const FormSelect = styled.select`
  padding: 0.875rem 1.125rem;
  background: #ffffff;
  border: 1px solid rgba(26, 26, 26, 0.12);
  border-radius: 12px;
  color: #1a1a1a;
  font-size: clamp(0.875rem, 1vw, 0.9375rem);
  font-family: 'Merriweather', Georgia, serif;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;
  max-width: 100%;
  height: 48px;

  &:focus {
    outline: none;
    border-color: #E8C547;
    box-shadow: 0 0 0 3px rgba(232, 197, 71, 0.1);
  }

  &:hover {
    border-color: rgba(26, 26, 26, 0.2);
  }
`;

const FormInput = styled.input`
  padding: 0.875rem 1.125rem;
  background: #ffffff;
  border: 1px solid rgba(26, 26, 26, 0.12);
  border-radius: 12px;
  color: #1a1a1a;
  font-size: clamp(0.875rem, 1vw, 0.9375rem);
  font-family: 'Merriweather', Georgia, serif;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;
  max-width: 100%;
  height: 48px;

  &::placeholder {
    color: #999999;
  }

  &:focus {
    outline: none;
    border-color: #E8C547;
    box-shadow: 0 0 0 3px rgba(232, 197, 71, 0.1);
  }

  &:hover {
    border-color: rgba(26, 26, 26, 0.2);
  }

  &:focus {
    outline: none;
    border-color: #E8C547;
    box-shadow: 0 0 0 3px rgba(255, 217, 15, 0.15);
  }

  &[type="number"] {
    -moz-appearance: textfield;

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  }
`;

const BrowseSubmitButton = styled.button`
  padding: 0.875rem clamp(2rem, 3vw, 2.5rem);
  background: #E8C547;
  color: #1a1a1a;
  border: none;
  border-radius: 12px;
  font-size: clamp(0.9375rem, 1.2vw, 1rem);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Merriweather', Georgia, serif;
  white-space: nowrap;
  min-width: 140px;
  letter-spacing: -0.005em;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #F0D675;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(232, 197, 71, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const FormError = styled.div`
  font-size: 0.8125rem;
  color: #d32f2f;
  margin-top: 0.25rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
`;

const homeSideImages: string[] = [
  'https://d3p3fw3rutb1if.cloudfront.net/photos/acc473bf-d2a0-4192-a53c-53e833937274', // yoga
  'https://d3p3fw3rutb1if.cloudfront.net/photos/69e8a1d7-652e-43d7-b206-9288a860e2cf', // sushi
  'https://d3p3fw3rutb1if.cloudfront.net/photos/11b96394-2874-4558-bca2-cf828621730a', // matcha
  'https://d3p3fw3rutb1if.cloudfront.net/photos/4ff19bf1-c464-40f1-a14e-f58adde92c72', // cake party
  'https://d3p3fw3rutb1if.cloudfront.net/photos/7e7f14d5-790d-4411-80dd-5834e9894677', // vino y ceramica
];

export const Browse = () => {
  const router = useRouter();
  const [browseCity, setBrowseCity] = React.useState('Bogotá');
  const [browseDate, setBrowseDate] = React.useState('');
  const [browseAttendees, setBrowseAttendees] = React.useState('1');
  const [attendeesError, setAttendeesError] = React.useState('');

  const handleBrowseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(browseAttendees) < 1) {
      setAttendeesError('Por favor ingresa un número válido de asistentes.');
      return;
    }
    setAttendeesError('');

    // Build query parameters
    const params = new URLSearchParams();
    params.set('city', browseCity);
    if (browseDate) {
      params.set('date', browseDate);
    }
    params.set('attendees', browseAttendees);

    // Navigate to experiences page with filters
    router.push(`/experiencias?${params.toString()}`);
  };

  return (
    <BrowseFormSection>
      <BrowseSideImagesContainer>
        {/* Left side images */}
        {[0, 1].map((index) => (
          <BrowseImageTile key={`left-${index}`} $position="left" $index={index}>
            {homeSideImages[index] ? (
              <BrowseImage src={homeSideImages[index]} alt="" />
            ) : (
              <BrowseImagePlaceholder />
            )}
          </BrowseImageTile>
        ))}
        {/* Right side images */}
        {[0, 1, 2].map((index) => (
          <BrowseImageTile key={`right-${index}`} $position="right" $index={index}>
            {homeSideImages[index + 2] ? (
              <BrowseImage src={homeSideImages[index + 2]} alt="" />
            ) : (
              <BrowseImagePlaceholder />
            )}
          </BrowseImageTile>
        ))}
      </BrowseSideImagesContainer>

      <BrowseContentWrapper>
        <BrowseSectionTitle>¿Prefieres explorar por tu cuenta?</BrowseSectionTitle>
        <BrowseSectionSubtitle>Elige una fecha, ciudad y tamaño del grupo.</BrowseSectionSubtitle>
        <BrowseForm onSubmit={handleBrowseSubmit}>
          <BrowseFormFields>
            <FormField>
              <FormLabel>Ciudad</FormLabel>
              <FormSelect
                value={browseCity}
                onChange={(e) => setBrowseCity(e.target.value)}
              >
                <option value="Bogotá">Bogotá</option>
                <option value="Medellín">Medellín</option>
              </FormSelect>
            </FormField>

            <FormField>
              <FormLabel>Fecha</FormLabel>
              <FormInput
                type="date"
                value={browseDate}
                onChange={(e) => setBrowseDate(e.target.value)}
                placeholder="Selecciona fecha"
              />
            </FormField>

            <FormField>
              <FormLabel>Asistentes</FormLabel>
              <FormInput
                type="number"
                value={browseAttendees}
                onChange={(e) => {
                  setBrowseAttendees(e.target.value);
                  setAttendeesError('');
                }}
                placeholder="# asistentes"
                min="1"
              />
              {attendeesError && <FormError>{attendeesError}</FormError>}
            </FormField>
          </BrowseFormFields>

          <BrowseButtonWrapper>
            <BrowseSubmitButton type="submit">
              Explorar
            </BrowseSubmitButton>
          </BrowseButtonWrapper>
        </BrowseForm>
      </BrowseContentWrapper>
    </BrowseFormSection>
  );
};
