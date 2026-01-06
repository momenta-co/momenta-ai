import type { Metadata } from "next";
import { Lora, DM_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Momenta | Experiencias Curadas en Colombia",
  description:
    "Descubre experiencias únicas y personalizadas en Colombia. Desde talleres gastronómicos hasta aventuras inolvidables.",
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
  authors: [{ name: "Momenta" }],
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: "https://www.momentaboutique.com",
    siteName: "Momenta",
    title: "Momenta | Experiencias Curadas en Colombia",
    description:
      "Descubre experiencias únicas y personalizadas en Colombia.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Momenta",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Momenta | Experiencias Curadas en Colombia",
    description:
      "Descubre experiencias únicas y personalizadas en Colombia.",
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
      <body className={`${lora.variable} ${dmSans.variable} antialiased`}>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
