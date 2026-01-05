"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, MapPin } from "lucide-react";
import type { Experience } from "@/types/experience";
import { cn } from "@/lib/utils";

interface ExperienceCardProps {
  experience: Experience;
  variant?: "default" | "featured";
}

export function ExperienceCard({
  experience,
  variant = "default",
}: ExperienceCardProps) {
  const formatPrice = (price: Experience["price"]) => {
    if (!price) return "Consultar precio";
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: price.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseInt(price.amount));
  };

  const slug = experience.url.split("/").pop();

  return (
    <Link href={`/experiencias/${slug}`} className="h-full">
      <Card
        className={cn(
          "group overflow-hidden border-0 bg-white shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col",
          variant === "featured" && "md:col-span-2 md:row-span-2"
        )}
      >
        {/* Image */}
        <div
          className={cn(
            "relative overflow-hidden flex-shrink-0",
            variant === "featured" ? "h-80 md:h-[400px]" : "h-56"
          )}
        >
          <Image
            src={experience.image}
            alt={experience.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

          {/* Location Badge */}
          <div className="absolute top-4 left-4">
            <Badge className="bg-cream/90 text-charcoal hover:bg-cream">
              <MapPin className="h-3 w-3 mr-1" />
              {experience.location}
            </Badge>
          </div>

          {/* Price Tag */}
          {experience.price && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-sage text-white hover:bg-sage/90">
                {formatPrice(experience.price)}
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <CardContent className="p-5 flex-1 flex flex-col">
          <h3
            className={cn(
              "font-serif text-charcoal group-hover:text-sage transition-colors line-clamp-2",
              variant === "featured" ? "text-2xl" : "text-lg"
            )}
          >
            {experience.title}
          </h3>

          {/* Meta Info */}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-charcoal/60">
            {experience.duration && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{experience.duration}</span>
              </div>
            )}
            {experience.min_people && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>Min. {experience.min_people} personas</span>
              </div>
            )}
          </div>

          {/* Categories */}
          <div className="mt-auto pt-4 flex flex-wrap gap-2">
            {experience.categories.slice(0, 3).map((category) => (
              <Badge
                key={category}
                variant="secondary"
                className="bg-sage-light/30 text-charcoal/80 hover:bg-sage-light/50 text-xs"
              >
                {category}
              </Badge>
            ))}
            {experience.categories.length > 3 && (
              <Badge
                variant="secondary"
                className="bg-sage-light/30 text-charcoal/80 text-xs"
              >
                +{experience.categories.length - 3}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
