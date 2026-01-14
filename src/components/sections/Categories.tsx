"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChefHat,
  Palette,
  Heart,
  Mountain,
  Briefcase,
  ArrowRight,
} from "lucide-react";

const categories = [
  {
    id: "gastronomico",
    name: "Gastronómico",
    icon: ChefHat,
    description:
      "Sabores que conectan. Momentos que perduran. Descubre el arte culinario colombiano.",
    image:
      "https://images.squarespace-cdn.com/content/v1/6437ebd38df658408b0c18cf/1743200349674-4SNDICQ5080RJRBW2VQE/Cata+.jpg?format=2500w",
    experiences: ["Cata de Café", "Taller de Sushi", "Cena Clandestina"],
  },
  {
    id: "manualidad",
    name: "Arte & Manualidades",
    icon: Palette,
    description:
      "Conecta con tu artista interior. Crea algo único con tus propias manos.",
    image:
      "https://images.squarespace-cdn.com/content/v1/6437ebd38df658408b0c18cf/1700870949831-LJ0DUNWXMHV224RPACOM/Captura+de+Pantalla+2023-11-24+a+la%28s%29+6.36.41+p.%C2%A0m..png?format=2500w",
    experiences: ["Cerámica y Vino", "Taller de Kintsugi", "Joyería Artesanal"],
  },
  {
    id: "bienestar",
    name: "Bienestar",
    icon: Heart,
    description:
      "Espacios para reconectar contigo mismo. Rituales de autocuidado y paz interior.",
    image:
      "https://images.squarespace-cdn.com/content/v1/6437ebd38df658408b0c18cf/1729548301279-SAM732OPLE2Z3UVHH5QX/WELLNESS.jpg?format=2500w",
    experiences: ["Hot Yoga", "Masaje en Casa", "Wellness Day Pass"],
  },
  {
    id: "aventura",
    name: "Aventura",
    icon: Mountain,
    description:
      "Más que un destino, un sentimiento que permanece. Experiencias que elevan.",
    image:
      "https://images.squarespace-cdn.com/content/v1/6437ebd38df658408b0c18cf/1698094120367-W0660ZIXMF8BUXCNT9AJ/image-asset.jpeg?format=2500w",
    experiences: ["Parapente Guatavita", "Clase de Polo", "Escapadas"],
  },
  {
    id: "corporativo",
    name: "Corporativo",
    icon: Briefcase,
    description:
      "Transforma tu equipo con experiencias que inspiran conexión y creatividad.",
    image:
      "https://images.squarespace-cdn.com/content/v1/6437ebd38df658408b0c18cf/1741667672781-NL9WSCHDWHQWNHH1TK37/WhatsApp+Image+2025-03-10+at+11.28.55+PM+%283%29.jpeg?format=2500w",
    experiences: ["Team Building", "Talleres Creativos", "Catas Empresariales"],
  },
];

export function Categories() {
  const [activeCategory, setActiveCategory] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveCategory((current) => (current + 1) % categories.length);
          return 0;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleCategoryClick = (index: number) => {
    setActiveCategory(index);
    setProgress(0);
  };

  const category = categories[activeCategory];

  return (
    <section className="py-24 bg-primary/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-primary text-sm font-medium uppercase tracking-wider">
            Categorías
          </span>
          <h2 className="mt-2 font-serif text-3xl md:text-4xl lg:text-5xl text-foreground">
            Encuentra tu experiencia ideal
          </h2>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((cat, index) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(index)}
              className={cn(
                "relative flex items-center gap-2 px-6 py-3 rounded-full transition-all cursor-pointer",
                activeCategory === index
                  ? "bg-foreground text-white"
                  : "bg-white text-foreground/70 hover:bg-foreground/10"
              )}
            >
              <cat.icon className="h-5 w-5" />
              <span className="font-medium">{cat.name}</span>
              {/* Progress Ring */}
              {activeCategory === index && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-1 bg-foreground/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden">
            <Image
              src={category.image}
              alt={category.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              quality={95}
              priority
              className="object-cover transition-all duration-500"
              unoptimized
            />
            <div className="absolute inset-0 bg-linear-to-t from-foreground/60 to-transparent" />
            {/* Tags */}
            <div className="absolute bottom-6 left-6 right-6 flex flex-wrap gap-2">
              {category.experiences.map((exp) => (
                <span
                  key={exp}
                  className="bg-white/90 text-foreground px-3 py-1 rounded-full text-sm"
                >
                  {exp}
                </span>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="inline-flex items-center gap-2 mb-4">
              <category.icon className="h-8 w-8 text-primary" />
              <span className="text-primary font-medium">{category.name}</span>
            </div>
            <h3 className="font-serif text-3xl md:text-4xl text-foreground leading-tight">
              {category.description}
            </h3>
            <p className="mt-6 text-foreground/60 text-lg">
              Explora nuestra colección de experiencias {category.name.toLowerCase()}
              diseñadas para crear momentos únicos e inolvidables.
            </p>
            <Button
              asChild
              className="mt-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8"
            >
              <Link href={`/experiencias?cat=${category.id}`}>
                Ver experiencias
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
