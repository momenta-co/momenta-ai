import { ExperienceGrid } from "@/components/experiences/ExperienceGrid";
import experiencesData from "@/data/experiences.json";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Experiencias | Momenta Concierge",
  description:
    "Explora nuestra colección de experiencias curadas en Colombia. Desde talleres gastronómicos hasta aventuras inolvidables.",
};

export default function ExperienciasPage() {
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="bg-indigo py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-flame text-sm font-medium uppercase tracking-wider">
              Descubre
            </span>
            <h1 className="mt-2 font-serif text-4xl md:text-5xl lg:text-6xl text-cream">
              Nuestras Experiencias
            </h1>
            <p className="mt-6 text-columbia/80 text-lg max-w-2xl mx-auto">
              Cada experiencia está diseñada para crear momentos que trascienden.
              Encuentra la perfecta para ti.
            </p>
          </div>
        </div>
      </section>

      {/* Experiences Grid */}
      <section className="py-16 bg-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ExperienceGrid
            experiences={experiencesData.experiencias}
            showFilters={true}
            showLoadMore={true}
          />
        </div>
      </section>
    </div>
  );
}
