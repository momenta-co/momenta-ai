import { Suspense } from "react";
import { ExperienceGrid } from "@/components/experiences/ExperienceGrid";
import { Categories } from "@/components/sections/Categories";
import { About } from "@/components/sections/About";
import { CTA } from "@/components/sections/CTA";
import { Footer } from "@/components/layout/Footer";
import experiencesData from "@/data/experiences.json";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Experiencias | Momenta",
  description:
    "Explora nuestra colección de experiencias curadas en Colombia. Desde talleres gastronómicos hasta aventuras inolvidables.",
};

export default function ExperienciasPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-sage-dark text-sm font-medium uppercase tracking-wider">
              Descubre
            </span>
            <h1 className="mt-2 font-serif text-4xl md:text-5xl lg:text-6xl text-charcoal">
              Nuestras Experiencias
            </h1>
            <p className="mt-6 text-warm-gray text-lg max-w-2xl mx-auto">
              Cada experiencia está diseñada para crear momentos que trascienden.
              Encuentra la perfecta para ti.
            </p>
          </div>
        </div>
      </section>

      {/* Experiences Grid */}
      <section className="py-16 bg-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Suspense fallback={<div className="text-center py-8">Cargando...</div>}>
            <ExperienceGrid
              experiences={experiencesData.experiencias}
              showFilters={true}
              showLoadMore={true}
            />
          </Suspense>
        </div>
      </section>

      {/* Categories */}
      <Categories />

      {/* About */}
      <About />

      {/* CTA */}
      <CTA />

      {/* Footer */}
      <Footer />
    </>
  );
}
