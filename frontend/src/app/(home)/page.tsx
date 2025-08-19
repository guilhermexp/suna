'use client';

import { FooterSection } from '@/components/home/sections/footer-section';
import { HeroSection } from '@/components/home/sections/hero-section';
import { ModalProviders } from '@/providers/modal-providers';
import { BackgroundAALChecker } from '@/components/auth/background-aal-checker';

export default function Home() {
  return (
    <>
      <ModalProviders />
      <BackgroundAALChecker>
        <main className="flex flex-col items-center justify-center min-h-screen w-full">
          <div className="w-full divide-y divide-border">
            <HeroSection />
            <FooterSection />
          </div>
        </main>
      </BackgroundAALChecker>
    </>
  );
}
