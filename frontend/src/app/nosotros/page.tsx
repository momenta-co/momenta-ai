import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Star, Heart, Users, Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nosotros | Momenta Concierge",
  description:
    "Conoce la historia detrás de Momenta Concierge. Creemos en el arte de conectar con propósito.",
};

const values = [
  {
    icon: Sparkles,
    title: "Refined",
    description:
      "Cada detalle cuenta. Curamos experiencias con una estética atemporal y una elegancia silenciosa.",
  },
  {
    icon: Heart,
    title: "Ritual",
    description:
      "Transformamos momentos ordinarios en rituales significativos que nutren el alma.",
  },
  {
    icon: Users,
    title: "Intentional",
    description:
      "Todo lo que hacemos tiene un propósito: crear conexiones auténticas y recuerdos duraderos.",
  },
];

const stats = [
  { number: "40+", label: "Experiencias curadas" },
  { number: "5,000+", label: "Momentos creados" },
  { number: "2", label: "Ciudades en Colombia" },
  { number: "98%", label: "Clientes satisfechos" },
];

export default function NosotrosPage() {
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="relative bg-indigo py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-96 h-96 bg-flame rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-64 h-64 bg-columbia rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 text-flame text-sm font-medium uppercase tracking-wider">
              <Star className="h-4 w-4" />
              Sobre Nosotros
            </span>
            <h1 className="mt-4 font-serif text-4xl md:text-5xl lg:text-6xl text-cream leading-tight">
              Creemos en el arte de conectar con propósito
            </h1>
            <p className="mt-6 text-columbia/80 text-xl leading-relaxed">
              En los momentos que trascienden, se sienten y se recuerdan.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-24 bg-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="relative h-[600px] rounded-2xl overflow-hidden">
                <Image
                  src="https://images.squarespace-cdn.com/content/v1/6437ebd38df658408b0c18cf/1730781828671-GWC7K6N08EO6J2J5BSSU/Tarde+de+amigas.jpeg"
                  alt="Equipo Momenta"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-flame text-white p-6 rounded-xl">
                <p className="font-serif text-3xl">2023</p>
                <p className="text-sm text-white/80">Año de fundación</p>
              </div>
            </div>

            <div>
              <h2 className="font-serif text-3xl md:text-4xl text-indigo">
                Nuestra Historia
              </h2>
              <div className="mt-8 space-y-6 text-indigo/70 leading-relaxed">
                <p>
                  Momenta nació de una convicción simple pero poderosa: la vida se
                  mide en momentos, no en años. Vimos cómo las rutinas diarias
                  nos alejaban de las experiencias que realmente importan.
                </p>
                <p>
                  Comenzamos en Bogotá con la misión de curar experiencias que
                  rompieran la monotonía y crearan recuerdos significativos.
                  Cada taller, cada cata, cada aventura fue diseñada con una
                  pregunta en mente: &quot;¿Esto dejará una huella?&quot;
                </p>
                <p>
                  Hoy, Momenta Concierge es más que una plataforma de
                  experiencias. Somos arquitectos de momentos, curadores de
                  conexiones y guardianes de lo esencial sobre lo excesivo.
                </p>
              </div>
              <p className="mt-8 font-serif text-xl text-indigo italic">
                &quot;Because when an experience is felt, it&apos;s remembered.&quot;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-columbia/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-flame text-sm font-medium uppercase tracking-wider">
              Nuestros Valores
            </span>
            <h2 className="mt-2 font-serif text-3xl md:text-4xl text-indigo">
              Refined · Ritual · Intentional
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value) => (
              <div
                key={value.title}
                className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 rounded-full bg-flame/10 flex items-center justify-center mb-6">
                  <value.icon className="h-7 w-7 text-flame" />
                </div>
                <h3 className="font-serif text-2xl text-indigo">{value.title}</h3>
                <p className="mt-4 text-indigo/60 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-indigo">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-serif text-4xl md:text-5xl text-flame">
                  {stat.number}
                </div>
                <div className="mt-2 text-columbia/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl md:text-4xl text-indigo">
            ¿Listo para crear tu momento?
          </h2>
          <p className="mt-4 text-indigo/60 max-w-xl mx-auto">
            Explora nuestras experiencias y encuentra la perfecta para ti.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 bg-flame hover:bg-flame/90 text-white rounded-full px-8"
          >
            <Link href="/experiencias">
              Ver Experiencias
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
