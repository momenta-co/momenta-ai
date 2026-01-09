export interface Price {
  amount: string;
  currency: string;
  unit: string;
}

export interface Experience {
  id: string;
  title: string;
  description: string;
  url: string;
  image: string;
  categories: string[];
  price: Price | null;
  duration: string | null;
  min_people: number | null;
  location: string;
  source_page: string;
}

export interface ExperiencesData {
  metadata: {
    total: number;
    fecha_extraccion: string;
    fuentes: string[];
  };
  experiencias: Experience[];
}

export type Category =
  | "Ver todo"
  | "Cocina"
  | "Bienestar"
  | "Manualidad"
  | "Gastronómico"
  | "Aventura"
  | "Corporativo"
  | "Para grupos"
  | "Para parejas"
  | "Individual"
  | "Para Niños"
  | "En Bogotá"
  | "En Medellín"
  | "En tu casa"
  | "Cerca a Bogotá"
  | "Fiesta"
  | "Belleza y Autocuidado";
