import { Hero } from "@/components/sections/Hero";
import { Footer } from "@/components/layout/Footer";
import { Browse } from "@/components/sections/Browse";
import { Feed } from "@/components/sections/Feed";
import { getFeedExperiences } from "@/lib/db/feed";

export default async function HomePage() {
  // Fetch experiences from database
  const feedData = await getFeedExperiences();

  return (
    <>
      <Hero />
      <Browse />
      <Feed
        tonightIdeas={feedData.tonightIdeas}
        stressRelief={feedData.stressRelief}
      />
      <Footer />
    </>
  );
}
