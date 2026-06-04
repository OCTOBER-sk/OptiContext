import React from 'react';
import { HeroSection } from '../components/landing/HeroSection';
import { CapabilitySection } from '../components/landing/CapabilitySection';
import { HowItWorks } from '../components/landing/HowItWorks';
import { TrustBlock } from '../components/landing/TrustBlock';
import { EcosystemSection } from '../components/landing/EcosystemSection';
import { FinalCTA } from '../components/landing/FinalCTA';
import { Footer } from '../components/landing/Footer';

export default function Landing() {
  return (
    <main style={{ animation: 'fadeIn 300ms ease both' }}>
      <HeroSection />
      <CapabilitySection />
      <HowItWorks />
      <TrustBlock />
      <EcosystemSection />
      <FinalCTA />
      <Footer />
    </main>
  );
}
