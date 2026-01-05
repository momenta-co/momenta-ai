import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Momenta Boutique',
  description: 'Todo lo que necesitas para romper la rutina y llenar de magia tus días',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
