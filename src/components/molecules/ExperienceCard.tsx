'use client';

import type { RecommendationData } from '@/types/chat';
import { motion } from 'framer-motion';
import { Clock, DollarSign, MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface ExperienceCardProps {
  recommendation: RecommendationData;
  index: number;
}

const formatPrice = (price: RecommendationData['price']) => {
  if (!price) return 'Consultar';
  const amount = parseInt(price.amount).toLocaleString('es-CO');
  return `${amount}`;
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
      className="flex flex-col h-full"
    >
      <Link
        href={recommendation.url}
        target="_blank"
        className="group block bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden border border-neutral-200/60 hover:border-primary-700/40 transition-all duration-700 hover:shadow-2xl hover:shadow-primary-700/15 shadow-lg shadow-neutral-900/10 h-full"
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
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent" />

          {/* Content Overlay */}
          <div className="absolute bottom-2 left-2 right-2 text-white flex flex-col gap-1">
            <h2 className="text-sm font-serif font-normal mb-0 leading-tight">
              {recommendation.title}
            </h2>

            <div className="flex items-center gap-3 text-xs opacity-90 font-light">
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
              <span className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                {formatPrice(recommendation.price)}
              </span>
            </div>
          </div>
        </div>

        {/* Content - Compact */}
        <div className="p-4">
          <p className="text-xs text-neutral-500 font-light leading-relaxed">
            {recommendation.reasons}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
