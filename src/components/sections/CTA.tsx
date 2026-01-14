import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle } from "lucide-react";

export function CTA() {
  return (
    <section className="py-24 bg-primary relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-white leading-tight">
          ¿Listo para crear tu próximo
          <br />
          <span className="italic">momento inolvidable?</span>
        </h2>
        <p className="mt-6 text-white/80 text-lg max-w-2xl mx-auto">
          Cuéntanos qué tipo de experiencia buscas y te ayudaremos a diseñar
          el momento perfecto para ti y los tuyos.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="bg-sidebar text-white hover:bg-sidebar/90 rounded-full px-8 h-14 text-lg"
          >
            <Link href="/experiencias">
              Explorar Experiencias
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-foreground/60 text-foreground bg-white/90 hover:bg-white rounded-full px-8 h-14 text-lg"
          >
            <a
              href="https://wa.me/573001234567?text=Hola,%20me%20interesa%20conocer%20más%20sobre%20las%20experiencias%20de%20Momenta"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Escribir por WhatsApp
            </a>
          </Button>
        </div>

        {/* Trust Badges */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-white/60 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white/60" />
            <span>Pago seguro</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white/60" />
            <span>Cancelación flexible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white/60" />
            <span>Soporte 24/7</span>
          </div>
        </div>
      </div>
    </section>
  );
}
