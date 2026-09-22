import { Accuracy } from '@/components/Accuracy';
import { Exploded } from '@/components/Exploded';
import { Faq } from '@/components/Faq';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Pricing } from '@/components/Pricing';
import { Reviews } from '@/components/Reviews';
import { SkipLink } from '@/components/SkipLink';
import { Statement } from '@/components/Statement';
import { Story } from '@/components/Story';

export default function Home() {
  return (
    <>
      <SkipLink />
      <Header />
      <main id="main">
        <Hero />
        <Statement />
        <Accuracy />
        <Exploded />
        <Story />
        <Reviews />
        <Pricing />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
