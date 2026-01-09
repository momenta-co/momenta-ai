import HeroChat from "@/components/sections/HeroChat";
import { Footer } from "@/components/layout/Footer";
import { Browse } from "@/components/sections/Browse";

export default function HomePage() {
  return (
    <>
      <HeroChat />
      <Browse />
      <Footer />
    </>
  );
}
