'use client';

import React, { useEffect, useState } from 'react';

const titleWords = ["auténtica", "especial", "curada", "memorable", "perfecta"];

export default function RotatingTitleWord() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % titleWords.length);
        setIsAnimating(false);
      }, 400);
    }, 5000); // Synchronized with carousel

    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className={`
        relative inline-block px-5 py-2 mx-1 rounded-xl bg-[#F5EFE0] text-neutral-1000
        transition-all duration-400
        ${isAnimating ? 'opacity-0 translate-y-2 scale-95' : 'opacity-100 translate-y-0 scale-100'}
      `}
    >
      {titleWords[currentIndex]}
    </span>
  );
}
