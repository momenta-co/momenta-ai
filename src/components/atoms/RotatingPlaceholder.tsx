'use client';

import React, { useEffect, useState } from 'react';

const suggestions = [
  "Somos un grupo de 6 amigos buscando algo divertido",
  "Quiero sorprender a mi pareja con algo romántico",
  "Necesito una actividad de team building para mi equipo",
  "Busco un taller de cocina para principiantes",
  "Quiero regalar una experiencia de bienestar",
  "Organizamos un cumpleaños especial",
];

export default function RotatingPlaceholder() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % suggestions.length);
        setIsAnimating(false);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className={`
        text-neutral-700/40 text-base sm:text-lg font-light transition-all duration-300 pointer-events-none
        ${isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}
      `}
    >
      {suggestions[currentIndex]}
    </span>
  );
}
