"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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

// Mapeo de IDs de categoría (URL) a nombres de categoría (datos)
const categoryMap: Record<string, string> = {
  gastronomico: "Gastronómico",
  manualidad: "Manualidad",
  bienestar: "Bienestar",
  aventura: "Aventura",
  corporativo: "Corporativo",
  cocina: "Cocina",
};

export function ExperienceGrid({
  experiences,
  showFilters = true,
  limit,
  showLoadMore = false,
}: ExperienceGridProps) {
  const searchParams = useSearchParams();
  const catParam = searchParams.get("cat");

  // Browse filters from URL
  const cityParam = searchParams.get("city");
  const dateParam = searchParams.get("date");
  const attendeesParam = searchParams.get("attendees");

  // Mapear el parámetro de URL al nombre de categoría
  const initialCategory = catParam ? (categoryMap[catParam] || "Ver todo") : "Ver todo";

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);

  // Actualizar cuando cambie el parámetro de URL
  useEffect(() => {
    const newCategory = catParam ? (categoryMap[catParam] || "Ver todo") : "Ver todo";
    setSelectedCategory(newCategory);
  }, [catParam]);

  // Initialize location from URL if city param exists
  const [selectedLocation, setSelectedLocation] = useState<string>(cityParam || "Todas");

  // Update location when city param changes
  useEffect(() => {
    if (cityParam) {
      setSelectedLocation(cityParam);
    }
  }, [cityParam]);

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

      {/* Browse Filters Display */}
      {(cityParam || dateParam || attendeesParam) && (
        <div className="mt-4 p-4 bg-cream/50 rounded-lg border border-charcoal/10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-charcoal/80">Filtros de búsqueda:</span>
            {cityParam && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gold/20 text-charcoal">
                📍 {cityParam}
              </span>
            )}
            {dateParam && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gold/20 text-charcoal">
                📅 {new Date(dateParam).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            )}
            {attendeesParam && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gold/20 text-charcoal">
                👥 {attendeesParam} {Number(attendeesParam) === 1 ? 'persona' : 'personas'}
              </span>
            )}
          </div>
        </div>
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
