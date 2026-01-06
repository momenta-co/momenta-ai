"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const cyclingWords = [
  "personalizadas",
  "únicas",
  "memorables",
  "transformadoras",
];

export function Hero() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentWordIndex((prev) => (prev + 1) % cyclingWords.length);
        setIsAnimating(false);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            'url("https://images.squarespace-cdn.com/content/v1/6437ebd38df658408b0c18cf/a5b4bb68-1eae-4592-8835-7b0e6f0d7ac0/image-asset.jpg")',
        }}
      >
        <div className="absolute inset-0 bg-charcoal/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Main Heading */}
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-cream leading-tight">
          Experiencias que se sienten
          <br />
          <span className="relative inline-block min-w-[280px] sm:min-w-[350px]">
            <span
              className={cn(
                "inline-block text-sage italic transition-all duration-300",
                isAnimating
                  ? "opacity-0 translate-y-4"
                  : "opacity-100 translate-y-0"
              )}
            >
              {cyclingWords[currentWordIndex]}
            </span>
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-cream/80 leading-relaxed">
          Tu aliado para crear momentos que trascienden. Curamos experiencias
          personalizadas en Colombia que conectan con el alma y se recuerdan para siempre.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="bg-sage hover:bg-sage/90 text-white rounded-full px-8 h-14 text-lg group"
          >
            <Link href="/experiencias">
              Explorar Experiencias
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-cream bg-cream/10 text-cream hover:bg-cream/20 rounded-full px-8 h-14 text-lg"
          >
            <Link href="/contacto">Hablar con Nosotros</Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="font-serif text-3xl sm:text-4xl text-sage">40+</div>
            <div className="mt-1 text-sm text-cream/60">Experiencias</div>
          </div>
          <div className="text-center">
            <div className="font-serif text-3xl sm:text-4xl text-sage">2</div>
            <div className="mt-1 text-sm text-cream/60">Ciudades</div>
          </div>
          <div className="text-center">
            <div className="font-serif text-3xl sm:text-4xl text-sage">5K+</div>
            <div className="mt-1 text-sm text-cream/60">Momentos Creados</div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-cream/40 flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-cream/60 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
}
