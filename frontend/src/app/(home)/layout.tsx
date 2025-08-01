import { Navbar } from '@/components/home/sections/navbar';
import { FooterSection } from '@/components/home/sections/footer-section';

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="w-full relative">
      <div className="block w-px h-full border-l border-border fixed top-0 left-6 z-10"></div>
      <div className="block w-px h-full border-r border-border fixed top-0 right-6 z-10"></div>
      <Navbar />
      {children}
      <FooterSection />
    </div>
  );
}
