import { Header } from '../Components/Landing/Header';
import { HeroSection } from '../Components/Landing/HeroSection';
import { FeaturesSection } from '../Components/Landing/FeaturesSection';
import { TechnologySection } from '../Components/Landing/TechnologySection';
import { ShowcaseSection } from '../Components/Landing/ShowcaseSection';
import { PromptSection } from '../Components/Landing/PromptSection';
import { Footer } from '../Components/Landing/Footer';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <TechnologySection />
      <ShowcaseSection />
      <PromptSection />
      <Footer />
    </div>
  );
};