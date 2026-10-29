import { useNavigate } from "@tanstack/react-router";
import { TopNav } from "./sections/TopNav";
import { HeroSection } from "./sections/HeroSection";
import { SocialProofSection } from "./sections/SocialProofSection";
import { FeaturesSection } from "./sections/FeaturesSection";
import { HowItWorksSection } from "./sections/HowItWorksSection";
import { PwaSection } from "./sections/PwaSection";
import { PricingSection } from "./sections/PricingSection";
import { FaqSection } from "./sections/FaqSection";
import { FinalCtaSection } from "./sections/FinalCtaSection";
import { LandingFooter } from "./sections/LandingFooter";
import { FounderSection } from "./sections/FounderSection";
import { LangProvider } from "./i18n";

/**
 * Landing pública. Composición de secciones independientes; toda la lógica
 * visual (animaciones, mockups, precios, testimonios, FAQ) vive en
 * `./sections/*` y los helpers compartidos en `./animations`.
 */
export function LandingPage() {
  const navigate = useNavigate();
  const goRegister = () => navigate({ to: "/registro" });
  const goLogin = () => navigate({ to: "/login" });
  const goDemo = () => navigate({ to: "/demo" });

  return (
    <LangProvider>
    <div className="min-h-dvh bg-background text-foreground flex flex-col overflow-x-hidden">
      <TopNav onEnter={goLogin} onCreate={goRegister} />
      <main className="flex-1">
        <HeroSection onCreate={goRegister} onDemo={goDemo} />
        <SocialProofSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PwaSection onCreate={goRegister} />
        <PricingSection onCreate={goRegister} />
        <FounderSection />
        <FaqSection />
        <FinalCtaSection onCreate={goRegister} />
      </main>
      <LandingFooter />
    </div>
    </LangProvider>
  );
}
