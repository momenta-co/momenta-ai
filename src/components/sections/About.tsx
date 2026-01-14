import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Heart, Users } from "lucide-react";

const values = [
  {
    icon: Sparkles,
    title: "Curadas con intención",
    description:
      "Cada experiencia es seleccionada cuidadosamente para asegurar momentos únicos y memorables.",
  },
  {
    icon: Heart,
    title: "Conexión auténtica",
    description:
      "Creamos espacios para conectar con otros, con nosotros mismos y con la cultura local.",
  },
  {
    icon: Users,
    title: "Para todos",
    description:
      "Desde parejas hasta grupos corporativos, diseñamos experiencias para cada ocasión.",
  },
];

export function About() {
  return (
    <section className="py-24 bg-sidebar">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <div className="relative">
            <div className="relative h-[500px] rounded-2xl overflow-hidden">
              <Image
                src="https://images.squarespace-cdn.com/content/v1/6437ebd38df658408b0c18cf/1730781828671-GWC7K6N08EO6J2J5BSSU/Tarde+de+amigas.jpeg"
                alt="Experiencia Momenta"
                fill
                className="object-cover"
              />
            </div>
            {/* Floating Card */}
            <div className="absolute -bottom-8 -right-8 bg-white p-6 rounded-xl shadow-xl max-w-[280px]">
              <p className="font-serif text-2xl text-foreground italic">
                &quot;Because when an experience is felt, it&apos;s remembered.&quot;
              </p>
              <div className="mt-4 flex items-center gap-2">
                <div className="w-8 h-0.5 bg-primary" />
                <span className="text-sm text-foreground/60">Momenta</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div>
            <span className="text-primary text-sm font-medium uppercase tracking-wider">
              Sobre Nosotros
            </span>
            <h2 className="mt-4 font-serif text-3xl md:text-4xl lg:text-5xl text-white leading-tight">
              Creemos en el arte de conectar con propósito
            </h2>
            <p className="mt-6 text-secondary/80 text-lg leading-relaxed">
              En Momenta, cada detalle es una declaración de intención.
              Nos inspira una estética atemporal, una elegancia silenciosa y una
              forma de crear que privilegia lo esencial sobre lo excesivo.
            </p>
            <p className="mt-4 text-secondary/80 leading-relaxed">
              No buscamos llamar la atención, sino dejar una impresión duradera.
              Somos tu aliado para transformar momentos ordinarios en recuerdos
              extraordinarios.
            </p>

            {/* Values */}
            <div className="mt-10 space-y-6">
              {values.map((value) => (
                <div key={value.title} className="flex gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <value.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-serif text-lg text-white">
                      {value.title}
                    </h4>
                    <p className="mt-1 text-secondary/60 text-sm">
                      {value.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Button
              asChild
              className="mt-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8"
            >
              <Link href="/nosotros">
                Conocer más
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
