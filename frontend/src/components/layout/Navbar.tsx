"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Experiencias", href: "/experiencias" },
  { name: "Corporativo", href: "/corporativo" },
  { name: "Nosotros", href: "/nosotros" },
  { name: "Contacto", href: "/contacto" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-cream/95 backdrop-blur-md shadow-sm"
          : "bg-transparent"
      )}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif text-2xl text-charcoal tracking-tight">
              Momenta
            </span>
            <span className="font-serif text-2xl text-charcoal italic">
              Concierge
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-charcoal/80 hover:text-charcoal transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:flex md:items-center md:gap-4">
            <Button
              className="bg-sage hover:bg-sage/90 text-white rounded-full px-6"
            >
              Reservar Ahora
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-charcoal">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Abrir menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-cream w-full sm:max-w-sm">
                <div className="flex flex-col gap-8 mt-8">
                  <Link
                    href="/"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2"
                  >
                    <span className="font-serif text-2xl text-charcoal">
                      Momenta
                    </span>
                    <span className="font-serif text-2xl text-charcoal italic">
                      Concierge
                    </span>
                  </Link>

                  <nav className="flex flex-col gap-4">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="text-lg font-medium text-charcoal/80 hover:text-charcoal transition-colors py-2"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </nav>

                  <Button
                    className="bg-sage hover:bg-sage/90 text-white rounded-full w-full"
                    onClick={() => setIsOpen(false)}
                  >
                    Reservar Ahora
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
}
