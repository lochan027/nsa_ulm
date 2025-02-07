import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import About from '@/components/About';
import AnnualEvents from '@/components/AnnualEvents';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <About />
      <AnnualEvents />
      <Footer />
    </>
  );
}
