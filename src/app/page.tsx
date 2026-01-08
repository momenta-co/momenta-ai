import { Suspense } from "react";
import HeroChat from "@/components/sections/HeroChat";
import { ExperienceGrid } from "@/components/experiences/ExperienceGrid";
import { Categories } from "@/components/sections/Categories";
import { About } from "@/components/sections/About";
import { CTA } from "@/components/sections/CTA";
import { Footer } from "@/components/layout/Footer";
import experiencesData from "@/data/experiences.json";

export default function HomePage() {
  return (
    <>
      {/* Hero Chat Section */}
      <HeroChat />

      {/* Experiences Section */}
      <section id="experiencias" className="py-20 bg-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-sage-dark text-sm font-medium uppercase tracking-wider">
              Descubre
            </span>
            <h2 className="mt-2 font-serif text-3xl md:text-4xl lg:text-5xl text-charcoal">
              Nuestras Experiencias
            </h2>
            <p className="mt-4 text-warm-gray text-lg max-w-2xl mx-auto">
              Cada experiencia está diseñada para crear momentos que trascienden.
              Encuentra la perfecta para ti.
            </p>
          </div>

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
