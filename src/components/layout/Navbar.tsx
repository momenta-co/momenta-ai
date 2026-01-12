"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle logo click - refresh if already on home page
  const handleLogoClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      window.location.reload();
    }
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out",
        isScrolled
          ? "bg-cream/95 backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,0.04)]"
          : "bg-transparent"
      )}
    >
      <nav className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Desktop Header - 3 Column Grid */}
        <div className="hidden md:grid md:grid-cols-3 md:items-center h-20">
          {/* Left - Catálogo Link */}
          <div className="flex items-center justify-start">
            <a
              href="/experiencias"
              className="group relative text-[13px] font-medium tracking-[0.12em] uppercase text-charcoal/70 hover:text-charcoal transition-colors duration-300"
            >
              Experiencias
              <span className="absolute -bottom-1 left-0 w-0 bg-sage-dark group-hover:w-full transition-all duration-300 ease-out" />
            </a>
          </div>

          {/* Center - Logo */}
          <div className="flex items-center justify-center">
            <Link
              href="/"
              className="relative group"
              onClick={handleLogoClick}
            >
              <Image
                src="https://images.squarespace-cdn.com/content/v1/6437ebd38df658408b0c18cf/d271814a-2a2f-4867-addd-320040f84a22/6Asset+3%403xh.png?format=1500w"
                alt="Momenta"
                width={160}
                height={45}
                className="h-8 w-auto transition-opacity duration-300 group-hover:opacity-80"
                priority
                unoptimized
              />
            </Link>
          </div>

          {/* Right - Login */}
          <div className="flex items-center justify-end">
            <Link
              href="/login"
              className="group relative text-[13px] font-medium tracking-[0.12em] uppercase text-charcoal/70 hover:text-charcoal transition-colors duration-300"
            >
              Waiting List
              <span className="absolute -bottom-1 left-0 w-0 bg-sage-dark group-hover:w-full transition-all duration-300 ease-out" />
            </Link>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="flex md:hidden items-center justify-between h-16">
          {/* Center - Logo */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2" onClick={handleLogoClick}>
            <Image
              src="https://images.squarespace-cdn.com/content/v1/6437ebd38df658408b0c18cf/d271814a-2a2f-4867-addd-320040f84a22/6Asset+3%403xh.png?format=1500w"
              alt="Momenta"
              width={120}
              height={35}
              className="h-6 w-auto"
              priority
              unoptimized
            />
          </Link>

          {/* Right - Menu & Login */}
          <div className="flex items-center gap-3">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-charcoal w-9 h-9">
                  <Menu className="h-5 w-5" strokeWidth={1.5} />
                  <span className="sr-only">Menú</span>
                </Button>
              </SheetTrigger>
              <SheetTitle className="hidden">
                Momenta Menú
              </SheetTitle>
              <SheetContent side="left" className="bg-cream w-full sm:max-w-sm border-l border-sage/10">
                <div className="flex flex-col h-full pt-8">
                  {/* Mobile Menu Logo */}
                  <Link
                    href="/"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center mb-12"
                  >
                    <Image
                      src="https://images.squarespace-cdn.com/content/v1/6437ebd38df658408b0c18cf/d271814a-2a2f-4867-addd-320040f84a22/6Asset+3%403xh.png?format=1500w"
                      alt="Momenta"
                      width={140}
                      height={40}
                      className="h-7 w-auto"
                      unoptimized
                    />
                  </Link>

                  {/* Mobile Navigation Links */}
                  <nav className="flex flex-col items-center gap-6">
                    {[
                      { name: "Experiencias", href: "/experiencias" },
                      { name: "Waiting List", href: "/login" },
                    ].map((item, index) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="text-md font-medium tracking-wide uppercase text-charcoal/70"
                        style={{
                          animationDelay: `${(index + 1) * 50}ms`,
                        }}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
}
