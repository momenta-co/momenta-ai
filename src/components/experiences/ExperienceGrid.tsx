"use client";

import { useState, useMemo } from "react";
import { ExperienceCard } from "./ExperienceCard";
import { CategoryFilter } from "./CategoryFilter";
import type { Experience } from "@/types/experience";
import { Button } from "@/components/ui/button";

interface ExperienceGridProps {
  experiences: Experience[];
  showFilters?: boolean;
  limit?: number;
  showLoadMore?: boolean;
}

const ITEMS_PER_PAGE = 9;

export function ExperienceGrid({
  experiences,
  showFilters = true,
  limit,
  showLoadMore = false,
}: ExperienceGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("Ver todo");
  const [selectedLocation, setSelectedLocation] = useState<string>("Todas");
  const [visibleCount, setVisibleCount] = useState(limit || ITEMS_PER_PAGE);

  const categories = useMemo(() => {
    const allCategories = experiences.flatMap((exp) => exp.categories);
    const uniqueCategories = Array.from(new Set(allCategories)).filter(
      (cat) =>
        cat !== "Ver todo" &&
        !cat.startsWith("En ") &&
        cat !== "Cerca a Bogotá"
    );
    return ["Ver todo", ...uniqueCategories.sort()];
  }, [experiences]);

  const locations = useMemo(() => {
    const allLocations = experiences.map((exp) => exp.location);
    const uniqueLocations = Array.from(new Set(allLocations));
    return ["Todas", ...uniqueLocations.sort()];
  }, [experiences]);

  const filteredExperiences = useMemo(() => {
    return experiences.filter((exp) => {
      const matchesCategory =
        selectedCategory === "Ver todo" ||
        exp.categories.includes(selectedCategory);
      const matchesLocation =
        selectedLocation === "Todas" || exp.location === selectedLocation;
      return matchesCategory && matchesLocation;
    });
  }, [experiences, selectedCategory, selectedLocation]);

  const visibleExperiences = filteredExperiences.slice(0, visibleCount);
  const hasMore = visibleCount < filteredExperiences.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
  };

  return (
    <div>
      {/* Filters */}
      {showFilters && (
        <CategoryFilter
          categories={categories}
          locations={locations}
          selectedCategory={selectedCategory}
          selectedLocation={selectedLocation}
          onCategoryChange={setSelectedCategory}
          onLocationChange={setSelectedLocation}
          totalResults={filteredExperiences.length}
        />
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {visibleExperiences.map((experience, index) => (
          <ExperienceCard
            key={experience.url}
            experience={experience}
            variant={index === 0 && !showFilters ? "featured" : "default"}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredExperiences.length === 0 && (
        <div className="text-center py-16">
          <p className="text-charcoal/60 text-lg">
            No encontramos experiencias con esos filtros.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setSelectedCategory("Ver todo");
              setSelectedLocation("Todas");
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      )}

      {/* Load More */}
      {showLoadMore && hasMore && (
        <div className="mt-12 text-center">
          <Button
            variant="outline"
            size="lg"
            onClick={handleLoadMore}
            className="rounded-full px-8 border-charcoal/20 text-charcoal hover:bg-charcoal hover:text-cream"
          >
            Ver más experiencias
          </Button>
        </div>
      )}
    </div>
  );
}
