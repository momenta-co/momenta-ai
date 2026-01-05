import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Momenta Concierge | Experiencias Curadas en Colombia",
  description:
    "Descubre experiencias únicas y personalizadas en Colombia. Desde talleres gastronómicos hasta aventuras inolvidables. Quiet Luxury Meets Unexpected Joy.",
  keywords: [
    "experiencias Colombia",
    "talleres Bogotá",
    "actividades Medellín",
    "experiencias curadas",
    "team building",
    "eventos corporativos",
    "bienestar",
    "gastronomía",
  ],
  authors: [{ name: "Momenta Concierge" }],
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: "https://www.momentaboutique.com",
    siteName: "Momenta Concierge",
    title: "Momenta Concierge | Experiencias Curadas en Colombia",
    description:
      "Descubre experiencias únicas y personalizadas en Colombia. Quiet Luxury Meets Unexpected Joy.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Momenta Concierge",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Momenta Concierge | Experiencias Curadas en Colombia",
    description:
      "Descubre experiencias únicas y personalizadas en Colombia. Quiet Luxury Meets Unexpected Joy.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className={`${bricolage.variable} antialiased`}>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
