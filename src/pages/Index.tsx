import Hero from "@/components/Hero";
import Problem from "@/components/Problem";
import Solution from "@/components/Solution";
import TechnicalAgent from "@/components/TechnicalAgent";
import Traction from "@/components/Traction";
import Footer from "@/components/Footer";
import { useEffect } from "react";

const Index = () => {
  // Ensure dark theme variables apply at the document level for proper blending
  useEffect(() => {
    const el = document.documentElement;
    el.classList.add("dark");
    return () => {
      el.classList.remove("dark");
    };
  }, []);

  const sections = [
    <Hero key="hero" />,
    <Problem key="problem" />,
    <Solution key="solution" />,
    <TechnicalAgent key="technical-agent" />,
    <Traction key="traction" />,
    <Footer key="footer" />,
  ];

  return (
    <div className="min-h-screen">
      {sections.map((SectionEl, i) => (
        <div
          key={i}
          className={i === 0 ? 'min-h-screen' : ''}
        >
          {SectionEl}
        </div>
      ))}
    </div>
  );
};

export default Index;
