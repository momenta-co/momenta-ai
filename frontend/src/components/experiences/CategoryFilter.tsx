"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { MapPin, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  categories: string[];
  locations: string[];
  selectedCategory: string;
  selectedLocation: string;
  onCategoryChange: (category: string) => void;
  onLocationChange: (location: string) => void;
  totalResults: number;
}

export function CategoryFilter({
  categories,
  locations,
  selectedCategory,
  selectedLocation,
  onCategoryChange,
  onLocationChange,
  totalResults,
}: CategoryFilterProps) {
  const hasActiveFilters =
    selectedCategory !== "Ver todo" || selectedLocation !== "Todas";

  return (
    <div className="space-y-4">
      {/* Location Filter */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-charcoal/60">
          <MapPin className="h-4 w-4" />
          <span className="text-sm font-medium">Ciudad:</span>
        </div>
        <div className="flex gap-2">
          {locations.map((location) => (
            <Button
              key={location}
              variant={selectedLocation === location ? "default" : "outline"}
              size="sm"
              onClick={() => onLocationChange(location)}
              className={cn(
                "rounded-full",
                selectedLocation === location
                  ? "bg-charcoal text-cream hover:bg-charcoal/90"
                  : "border-charcoal/20 text-charcoal hover:bg-charcoal/10"
              )}
            >
              {location}
            </Button>
          ))}
        </div>
      </div>

      {/* Category Tabs */}
      <ScrollArea className="w-full whitespace-nowrap">
        <Tabs value={selectedCategory} onValueChange={onCategoryChange}>
          <TabsList className="bg-transparent h-auto p-0 gap-2">
            {categories.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-all",
                  "data-[state=active]:bg-sage data-[state=active]:text-white",
                  "data-[state=inactive]:bg-sage-light/30 data-[state=inactive]:text-charcoal/70",
                  "data-[state=inactive]:hover:bg-sage-light/50"
                )}
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Results Count & Clear */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-charcoal/60">
          {totalResults} experiencia{totalResults !== 1 ? "s" : ""} encontrada
          {totalResults !== 1 ? "s" : ""}
        </p>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onCategoryChange("Ver todo");
              onLocationChange("Todas");
            }}
            className="text-charcoal hover:text-charcoal/80"
          >
            <X className="h-4 w-4 mr-1" />
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
