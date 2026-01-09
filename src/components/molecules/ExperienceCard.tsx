'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, MapPin } from 'lucide-react';
import type { RecommendationData } from '@/types/chat';

interface ExperienceCardProps {
  recommendation: RecommendationData;
  index: number;
}

const formatPrice = (price: RecommendationData['price']) => {
  if (!price) return 'Consultar';
  const amount = parseInt(price.amount).toLocaleString('es-CO');
  return `$${amount}`;
};

export default function ExperienceCard({ recommendation, index }: ExperienceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className="flex flex-col"
    >
      <Link
        href={recommendation.url}
        target="_blank"
        className="group block bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden border border-neutral-200/60 hover:border-primary-700/40 transition-all duration-700 hover:shadow-2xl hover:shadow-primary-700/15 hover:scale-[1.02] mb-3 shadow-lg shadow-neutral-900/10"
      >
        {/* Image with overlay */}
        <div className="relative h-[100px] sm:h-[120px] overflow-hidden">
          <Image
            src={recommendation.image}
            alt={recommendation.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            unoptimized
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Number indicator */}
          <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center">
            <span className="text-[10px] font-semibold text-neutral-800">{index + 1}</span>
          </div>

          {/* Price badge */}
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-white/95 backdrop-blur-sm rounded-full">
            <span className="text-xs font-semibold text-primary-700">
              {formatPrice(recommendation.price)}
            </span>
          </div>
        </div>

        {/* Content - Compact */}
        <div className="p-4">
          <h3 className="font-serif text-base sm:text-lg text-neutral-900 leading-snug line-clamp-2 group-hover:text-primary-700 transition-colors duration-500 mb-3">
            {recommendation.title}
          </h3>

          <div className="flex items-center gap-3 text-xs text-neutral-500">
            {recommendation.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {recommendation.duration}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {recommendation.location}
            </span>
          </div>
        </div>
      </Link>

      {/* AI Reasoning - Why Momenta chose this */}
      <div className="px-3">
        <p className="text-xs text-neutral-600 leading-relaxed italic font-light">
          "{recommendation.reasons}"
        </p>
      </div>
    </motion.div>
  );
}
