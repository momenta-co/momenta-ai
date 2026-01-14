import Link from "next/link";
import Image from "next/image";
import { Instagram, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative bg-sidebar text-sidebar-foreground overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Footer - Two Column Layout */}
        <div className="py-16 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-12">

          {/* Left Column: Brand & Tagline */}
          <div className="space-y-8">
            <Link href="/" className="inline-block group">
              <Image
                src="https://images.squarespace-cdn.com/content/v1/6437ebd38df658408b0c18cf/d271814a-2a2f-4867-addd-320040f84a22/6Asset+3%403xh.png?format=1500w"
                alt="Momenta"
                width={200}
                height={56}
                className="h-10 w-auto brightness-0 invert transition-all duration-500 group-hover:scale-105 group-hover:brightness-110"
                unoptimized
              />
            </Link>

            <div className="space-y-6 max-w-md">
              <p className="text-sidebar-foreground/95 leading-relaxed text-lg font-light tracking-wide">
                Creemos en el arte de conectar con propósito. En los momentos que
                trascienden, se sienten y se recuerdan.
              </p>
            </div>
          </div>

          {/* Right Column: Instagram (Top) + Contact (Bottom) */}
          <div className="space-y-12">

            {/* Instagram Section - Horizontal Layout */}
            <a
              href="https://instagram.com/momenta_co"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block"
            >
              {/* Decorative glow */}
              <div className="absolute -inset-4 rounded-2xl bg-linear-to-br from-primary/40 via-primary/50 to-white/20 opacity-0 group-hover:opacity-100 transition-all duration-700 blur-xl" />

              {/* Main Instagram button - Row Direction */}
              <div className="relative flex items-center gap-6 p-6 rounded-2xl border-2 border-primary/70 bg-linear-to-br from-primary/30 to-primary/20 backdrop-blur-sm transition-all duration-500 group-hover:border-primary group-hover:bg-linear-to-br group-hover:from-primary/40 group-hover:to-primary/30 group-hover:shadow-2xl group-hover:shadow-primary/40 group-hover:-translate-y-1">

                {/* Icon */}
                <div className="relative shrink-0">
                  <div className="absolute -inset-2 rounded-xl bg-linear-to-r from-primary via-primary to-primary opacity-0 group-hover:opacity-60 blur-lg transition-all duration-700" />
                  <div className="relative bg-linear-to-br from-primary to-primary p-4 rounded-xl shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
                    <Instagram className="h-8 w-8 text-primary-foreground" strokeWidth={1.5} />
                  </div>
                </div>

                {/* Text Content */}
                <div className="flex-1 space-y-1">
                  <p className="text-white font-serif text-xl tracking-wide">
                    Síguenos
                  </p>
                  <p className="text-white text-sm tracking-widest uppercase font-light">
                    @momenta_co
                  </p>
                  <p className="text-secondary/85 text-xs italic">
                    Experiencias que inspiran
                  </p>
                </div>
              </div>
            </a>

            {/* Contact Section */}
            <ul className="space-y-5">
              <li className="group">
                <div className="flex items-start gap-3 text-white/85 transition-colors duration-300 group-hover:text-white">
                  <MapPin className="h-5 w-5 shrink-0 mt-0.5 text-primary transition-all duration-300 group-hover:scale-110 group-hover:text-primary" strokeWidth={1.5} />
                  <span className="text-sm leading-relaxed">
                    Bogotá, {' '}
                    <span className="text-secondary/75">Colombia</span>
                  </span>
                </div>
              </li>
              <li className="group">
                <a
                  href="mailto:hello@momentaboutique.com"
                  className="flex items-center gap-3 text-white/85 hover:text-white transition-all duration-300 group-hover:translate-x-1"
                >
                  <Mail className="h-5 w-5 shrink-0 text-primary transition-all duration-300 group-hover:scale-110 group-hover:text-primary" strokeWidth={1.5} />
                  <span className="text-sm">hello@momentaboutique.com</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-sidebar-border py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-secondary/70 text-xs tracking-wider">
              © {new Date().getFullYear()} Momenta. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-2 text-secondary/65 text-xs">
              <Link href="/terminos" className="hover:text-white transition-colors duration-300">
                Términos
              </Link>
              <span className="text-primary/70">•</span>
              <Link href="/privacidad" className="hover:text-white transition-colors duration-300">
                Privacidad
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
