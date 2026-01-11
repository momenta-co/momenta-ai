import Link from "next/link";
import Image from "next/image";
import { Instagram, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative bg-[#B3D4BC] text-cream overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-sage-dark/5 via-transparent to-columbia/5 pointer-events-none" />

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
              <p className="text-cream/95 leading-relaxed text-lg font-light tracking-wide">
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
              <div className="absolute -inset-4 rounded-2xl bg-gradient-to-br from-sage-dark/40 via-columbia/50 to-cream/20 opacity-0 group-hover:opacity-100 transition-all duration-700 blur-xl" />

              {/* Main Instagram button - Row Direction */}
              <div className="relative flex items-center gap-6 p-6 rounded-2xl border-2 border-sage-dark/70 bg-gradient-to-br from-sage-dark/30 to-columbia/20 backdrop-blur-sm transition-all duration-500 group-hover:border-sage-dark group-hover:bg-gradient-to-br group-hover:from-sage-dark/40 group-hover:to-columbia/30 group-hover:shadow-2xl group-hover:shadow-sage-dark/40 group-hover:-translate-y-1">

                {/* Icon */}
                <div className="relative flex-shrink-0">
                  <div className="absolute -inset-2 rounded-xl bg-gradient-to-r from-sage-dark via-columbia to-sage-dark opacity-0 group-hover:opacity-60 blur-lg transition-all duration-700" />
                  <div className="relative bg-gradient-to-br from-sage-dark to-columbia p-4 rounded-xl shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
                    <Instagram className="h-8 w-8 text-charcoal" strokeWidth={1.5} />
                  </div>
                </div>

                {/* Text Content */}
                <div className="flex-1 space-y-1">
                  <p className="text-cream font-serif text-xl tracking-wide">
                    Síguenos
                  </p>
                  <p className="text-cream text-sm tracking-widest uppercase font-light">
                    @momenta_co
                  </p>
                  <p className="text-sage-light/85 text-xs italic">
                    Experiencias que inspiran
                  </p>
                </div>
              </div>
            </a>

            {/* Contact Section */}
            <ul className="space-y-5">
              <li className="group">
                <div className="flex items-start gap-3 text-cream/85 transition-colors duration-300 group-hover:text-cream">
                  <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5 text-sage-dark transition-all duration-300 group-hover:scale-110 group-hover:text-columbia" strokeWidth={1.5} />
                  <span className="text-sm leading-relaxed">
                    Bogotá, {' '}
                    <span className="text-sage-light/75">Colombia</span>
                  </span>
                </div>
              </li>
              <li className="group">
                <a
                  href="mailto:hello@momentaboutique.com"
                  className="flex items-center gap-3 text-cream/85 hover:text-cream transition-all duration-300 group-hover:translate-x-1"
                >
                  <Mail className="h-5 w-5 shrink-0 text-sage-dark transition-all duration-300 group-hover:scale-110 group-hover:text-columbia" strokeWidth={1.5} />
                  <span className="text-sm">hello@momentaboutique.com</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-charcoal/20 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-sage-light/70 text-xs tracking-wider">
              © {new Date().getFullYear()} Momenta. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-2 text-sage-light/65 text-xs">
              <Link href="/terminos" className="hover:text-cream transition-colors duration-300">
                Términos
              </Link>
              <span className="text-sage-dark/70">•</span>
              <Link href="/privacidad" className="hover:text-cream transition-colors duration-300">
                Privacidad
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
