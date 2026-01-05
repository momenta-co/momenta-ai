import { Hero } from "@/components/sections/Hero";
import AIChatVoice from "@/components/sections/AIChatVoice";
import { FeaturedExperiences } from "@/components/sections/FeaturedExperiences";
import { About } from "@/components/sections/About";
import { Categories } from "@/components/sections/Categories";
import { CTA } from "@/components/sections/CTA";
import experiencesData from "@/data/experiences.json";

export default function HomePage() {
  return (
    <>
      <Hero />
      <AIChatVoice />
      <FeaturedExperiences experiences={experiencesData.experiencias} />
      <Categories />
      <About />
      <CTA />
    </>
  );
}
