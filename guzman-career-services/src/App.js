import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Services from './components/Services';
import HowItWorks from './components/HowItWorks';
import About from './components/About';
import WhyChooseUs from './components/WhyChooseUs';
// import Testimonials from './components/Testimonials';
import CTA from './components/CTA';
import Contact from './components/Contact';
import Footer from './components/Footer';
import './App.css';

function App() {
  return (
    <div className="App">
      <Header />
      <main>
        <Hero />
        <Services />
        <HowItWorks />
        <About />
        <WhyChooseUs />
        {/* <Testimonials /> */}
        <CTA />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

export default App;
