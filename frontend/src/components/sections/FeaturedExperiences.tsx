"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExperienceCard } from "@/components/experiences/ExperienceCard";
import type { Experience } from "@/types/experience";

interface FeaturedExperiencesProps {
  experiences: Experience[];
}

export function FeaturedExperiences({ experiences }: FeaturedExperiencesProps) {
  // Get featured experiences (first 6)
  const featuredExperiences = experiences.slice(0, 6);

  return (
    <section className="py-24 bg-cream">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <span className="text-sage text-sm font-medium uppercase tracking-wider">
              Explora
            </span>
            <h2 className="mt-2 font-serif text-3xl md:text-4xl lg:text-5xl text-charcoal">
              Experiencias Destacadas
            </h2>
            <p className="mt-4 text-charcoal/60 max-w-xl">
              Descubre nuestras experiencias más populares, diseñadas para crear
              momentos que trascienden y se recuerdan.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="rounded-full border-charcoal/20 text-charcoal hover:bg-charcoal hover:text-cream self-start md:self-auto"
          >
            <Link href="/experiencias">
              Ver todas
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredExperiences.map((experience) => (
            <ExperienceCard key={experience.url} experience={experience} />
          ))}
        </div>
      </div>
    </section>
  );
}
