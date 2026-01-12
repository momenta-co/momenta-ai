import { Hero } from "@/components/sections/Hero";
import { Footer } from "@/components/layout/Footer";
import { TestChat } from "@/components/sections/TestChat";

export default async function HomePage() {
  return (
    <>
      <Hero />
      <TestChat />
      <Footer />
    </>
  );
}
