import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Users,
  Lightbulb,
  Heart,
  Trophy,
  CheckCircle,
  Building,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Corporativo | Momenta Concierge",
  description:
    "Experiencias de team building y eventos corporativos diseñados para fortalecer equipos y crear conexiones significativas.",
};

const benefits = [
  {
    icon: Users,
    title: "Fortalece tu equipo",
    description:
      "Actividades diseñadas para mejorar la comunicación, colaboración y confianza entre miembros del equipo.",
  },
  {
    icon: Lightbulb,
    title: "Estimula la creatividad",
    description:
      "Talleres que despiertan el pensamiento innovador y la resolución creativa de problemas.",
  },
  {
    icon: Heart,
    title: "Bienestar laboral",
    description:
      "Experiencias de wellness que reducen el estrés y mejoran el bienestar general de tus colaboradores.",
  },
  {
    icon: Trophy,
    title: "Reconocimiento",
    description:
      "Celebra logros y fechas especiales con experiencias memorables para tu equipo.",
  },
];

const experiences = [
  {
    title: "Talleres Culinarios",
    description: "Cocina en equipo: desde sushi hasta coctelería",
    image:
      "https://images.squarespace-cdn.com/content/v1/6437ebd38df658408b0c18cf/1716471006059-2H68L0QZA57LKBJ6PURX/Captura+de+Pantalla+2024-05-23+a+la%28s%29+8.05.18+a.%C2%A0m..png",
  },
  {
    title: "Arte & Creatividad",
    description: "Cerámica, pintura, manualidades colaborativas",
    image:
      "https://images.squarespace-cdn.com/content/v1/6437ebd38df658408b0c18cf/1700870949831-LJ0DUNWXMHV224RPACOM/Captura+de+Pantalla+2023-11-24+a+la%28s%29+6.36.41+p.%C2%A0m..png",
  },
  {
    title: "Catas & Degustaciones",
    description: "Vino, café, licores ancestrales colombianos",
    image:
      "https://images.squarespace-cdn.com/content/v1/6437ebd38df658408b0c18cf/1743200349674-4SNDICQ5080RJRBW2VQE/Cata+.jpg",
  },
  {
    title: "Wellness & Bienestar",
    description: "Yoga, mindfulness, sesiones de relajación",
    image:
      "https://images.squarespace-cdn.com/content/v1/6437ebd38df658408b0c18cf/1729548301279-SAM732OPLE2Z3UVHH5QX/WELLNESS.jpg",
  },
];

const clients = [
  "Empresas de tecnología",
  "Agencias de publicidad",
  "Firmas de abogados",
  "Startups",
  "Multinacionales",
  "ONGs",
];

export default function CorporativoPage() {
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="relative bg-indigo py-24 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.squarespace-cdn.com/content/v1/6437ebd38df658408b0c18cf/1741667672781-NL9WSCHDWHQWNHH1TK37/WhatsApp+Image+2025-03-10+at+11.28.55+PM+%283%29.jpeg"
            alt="Team building"
            fill
            className="object-cover opacity-20"
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-flame/20 text-flame px-4 py-2 rounded-full mb-6">
              <Building className="h-4 w-4" />
              <span className="text-sm font-medium">Experiencias Corporativas</span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-cream leading-tight">
              Transforma tu equipo con experiencias que inspiran
            </h1>
            <p className="mt-6 text-columbia/80 text-xl">
              Diseñamos experiencias de team building y eventos corporativos que
              fortalecen la conexión entre colaboradores y dejan una huella
              duradera.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="bg-flame hover:bg-flame/90 text-white rounded-full px-8"
              >
                <Link href="/contacto">
                  Solicitar propuesta
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-cream/40 text-cream hover:bg-cream/10 rounded-full px-8"
              >
                <Link href="/experiencias?cat=Corporativo">Ver experiencias</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 bg-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-flame text-sm font-medium uppercase tracking-wider">
              Beneficios
            </span>
            <h2 className="mt-2 font-serif text-3xl md:text-4xl text-indigo">
              ¿Por qué elegir Momenta para tu empresa?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit) => (
              <Card key={benefit.title} className="border-0 shadow-sm text-center">
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-full bg-flame/10 flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="h-7 w-7 text-flame" />
                  </div>
                  <h3 className="font-serif text-xl text-indigo">
                    {benefit.title}
                  </h3>
                  <p className="mt-3 text-indigo/60 text-sm">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Experiences */}
      <section className="py-24 bg-columbia/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-flame text-sm font-medium uppercase tracking-wider">
              Experiencias
            </span>
            <h2 className="mt-2 font-serif text-3xl md:text-4xl text-indigo">
              Actividades populares para equipos
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {experiences.map((exp) => (
              <div
                key={exp.title}
                className="group relative h-80 rounded-2xl overflow-hidden"
              >
                <Image
                  src={exp.image}
                  alt={exp.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-indigo/80 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="font-serif text-xl">{exp.title}</h3>
                  <p className="mt-2 text-cream/70 text-sm">{exp.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-24 bg-indigo">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-flame text-sm font-medium uppercase tracking-wider">
              Proceso
            </span>
            <h2 className="mt-2 font-serif text-3xl md:text-4xl text-cream">
              Cómo trabajamos
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Consulta",
                description: "Entendemos tus objetivos, equipo y presupuesto",
              },
              {
                step: "02",
                title: "Propuesta",
                description:
                  "Diseñamos una experiencia a medida para tu empresa",
              },
              {
                step: "03",
                title: "Coordinación",
                description: "Nos encargamos de todos los detalles logísticos",
              },
              {
                step: "04",
                title: "Ejecución",
                description:
                  "Facilitamos la experiencia y aseguramos su éxito",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="text-flame font-serif text-4xl mb-4">
                  {item.step}
                </div>
                <h3 className="font-serif text-xl text-cream">{item.title}</h3>
                <p className="mt-3 text-columbia/60 text-sm">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clients */}
      <section className="py-24 bg-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-flame text-sm font-medium uppercase tracking-wider">
                Confianza
              </span>
              <h2 className="mt-2 font-serif text-3xl md:text-4xl text-indigo">
                Empresas que confían en nosotros
              </h2>
              <p className="mt-4 text-indigo/60">
                Hemos trabajado con empresas de todos los tamaños e industrias,
                ayudándoles a crear conexiones significativas entre sus equipos.
              </p>

              <div className="mt-8 space-y-3">
                {clients.map((client) => (
                  <div key={client} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-flame" />
                    <span className="text-indigo/70">{client}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative h-[400px] rounded-2xl overflow-hidden">
              <Image
                src="https://images.squarespace-cdn.com/content/v1/6437ebd38df658408b0c18cf/1719517066875-YSFE58JBGL6LZZTLZ9TI/WhatsApp+Image+2024-06-27+at+1.28.56+PM.jpeg"
                alt="Evento corporativo"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-flame">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl md:text-4xl text-white">
            ¿Listo para transformar tu equipo?
          </h2>
          <p className="mt-4 text-white/80 max-w-xl mx-auto">
            Cuéntanos sobre tu empresa y te enviaremos una propuesta
            personalizada sin compromiso.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 bg-white text-flame hover:bg-cream rounded-full px-8"
          >
            <Link href="/contacto">
              Solicitar propuesta
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
