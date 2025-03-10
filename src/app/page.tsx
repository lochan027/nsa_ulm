import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import About from '@/components/About';
import BoardMembers from '@/components/BoardMembers';
import AnnualEvents from '@/components/AnnualEvents';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <About />
      <BoardMembers />
      <AnnualEvents />
      <Footer />
    </>
  );
} 