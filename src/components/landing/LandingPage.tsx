import { useNavigate } from "@tanstack/react-router";
import { TopNav } from "./sections/TopNav";
import { HeroSection } from "./sections/HeroSection";
import { SocialProofSection } from "./sections/SocialProofSection";
import { FeaturesSection } from "./sections/FeaturesSection";
import { HowItWorksSection } from "./sections/HowItWorksSection";
import { PwaSection } from "./sections/PwaSection";
import { PricingSection } from "./sections/PricingSection";
import { TestimonialsSection } from "./sections/TestimonialsSection";
import { FaqSection } from "./sections/FaqSection";
import { FinalCtaSection } from "./sections/FinalCtaSection";
import { LandingFooter } from "./sections/LandingFooter";

/**
 * Landing pública. Composición de secciones independientes; toda la lógica
 * visual (animaciones, mockups, precios, testimonios, FAQ) vive en
 * `./sections/*` y los helpers compartidos en `./animations`.
 */
export function LandingPage() {
  const navigate = useNavigate();
  const goRegister = () => navigate({ to: "/registro" });
  const goLogin = () => navigate({ to: "/login" });

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col overflow-x-hidden">
      <TopNav onEnter={goLogin} onCreate={goRegister} />
      <main className="flex-1">
        <HeroSection onCreate={goRegister} onEnter={goLogin} />
        <SocialProofSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PwaSection onCreate={goRegister} />
        <PricingSection onCreate={goRegister} />
        <TestimonialsSection />
        <FaqSection />
        <FinalCtaSection onCreate={goRegister} />
      </main>
      <LandingFooter />
    </div>
  );
}
