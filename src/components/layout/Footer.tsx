import Link from "next/link";
import Image from "next/image";
import { Instagram, Mail, Phone, MapPin } from "lucide-react";

const footerLinks = {
  experiencias: [
    { name: "Gastronómicas", href: "/experiencias?cat=gastronomico" },
    { name: "Bienestar", href: "/experiencias?cat=bienestar" },
    { name: "Manualidades", href: "/experiencias?cat=manualidad" },
    { name: "Aventura", href: "/experiencias?cat=aventura" },
  ],
  empresa: [
    { name: "Nosotros", href: "/nosotros" },
    { name: "Corporativo", href: "/corporativo" },
    { name: "Blog", href: "/blog" },
    { name: "Aliados", href: "/aliados" },
  ],
  soporte: [
    { name: "Contacto", href: "/contacto" },
    { name: "FAQ", href: "/faq" },
    { name: "Términos", href: "/terminos" },
    { name: "Privacidad", href: "/privacidad" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-charcoal text-cream">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="py-10 sm:py-12 lg:py-16 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="inline-block">
              <Image
                src="https://images.squarespace-cdn.com/content/v1/6437ebd38df658408b0c18cf/d271814a-2a2f-4867-addd-320040f84a22/6Asset+3%403xh.png?format=1500w"
                alt="Momenta"
                width={160}
                height={45}
                className="h-6 sm:h-8 w-auto brightness-0 invert"
                unoptimized
              />
            </Link>
            <p className="mt-3 sm:mt-4 text-sage-light/80 max-w-sm leading-relaxed text-sm sm:text-base">
              Creemos en el arte de conectar con propósito. En los momentos que
              trascienden, se sienten y se recuerdan.
            </p>
            <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-sage-light/60 italic">
              &quot;Because when an experience is felt, it&apos;s remembered.&quot;
            </p>

            {/* Social Links */}
            <div className="mt-4 sm:mt-6 flex items-center gap-4">
              <a
                href="https://instagram.com/momenta_concierge"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sage-light/60 hover:text-sage-dark transition-colors"
              >
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </a>
              <a
                href="mailto:hello@momentaboutique.com"
                className="text-sage-light/60 hover:text-sage-dark transition-colors"
              >
                <Mail className="h-5 w-5" />
                <span className="sr-only">Email</span>
              </a>
            </div>
          </div>

          {/* Experiencias */}
          <div>
            <h4 className="font-serif text-base sm:text-lg text-cream mb-3 sm:mb-4">Experiencias</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.experiencias.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sage-light/70 hover:text-cream transition-colors text-xs sm:text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h4 className="font-serif text-base sm:text-lg text-cream mb-3 sm:mb-4">Empresa</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.empresa.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sage-light/70 hover:text-cream transition-colors text-xs sm:text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 sm:col-span-1">
            <h4 className="font-serif text-base sm:text-lg text-cream mb-3 sm:mb-4">Contacto</h4>
            <ul className="space-y-2 sm:space-y-3">
              <li className="flex items-center gap-2 text-sage-light/70 text-xs sm:text-sm">
                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>Bogotá & Medellín, Colombia</span>
              </li>
              <li>
                <a
                  href="tel:+573001234567"
                  className="flex items-center gap-2 text-sage-light/70 hover:text-cream transition-colors text-xs sm:text-sm"
                >
                  <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>+57 300 123 4567</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@momentaboutique.com"
                  className="flex items-center gap-2 text-sage-light/70 hover:text-cream transition-colors text-xs sm:text-sm"
                >
                  <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="break-all sm:break-normal">hello@momentaboutique.com</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-columbia/20 py-4 sm:py-6 flex items-center justify-center">
          <p className="text-sage-light/60 text-xs sm:text-sm text-center">
            © {new Date().getFullYear()} Momenta. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
