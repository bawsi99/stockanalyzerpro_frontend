import { Card } from "@/components/ui/card";
import { Users, Workflow, DollarSign } from "lucide-react";
import { useElementAnimation } from "@/hooks/use-element-animation";
import { NetworkGraph } from "@/components/graphics/NetworkGraph";
import { useRef } from "react";
import heroBg from "@/assets/hero-bg.jpg";

const Problem = () => {
  const headerAnimation = useElementAnimation({
    minY: 25,
    maxY: 75,
    maxScale: 1.05,
    minScale: 0.92,
  });
  
  const problems = [
    {
      icon: Users,
      title: "Human Bottleneck",
      description: "Expensive teams of analysts cover only 20–30 stocks/day, making scale across thousands impossible.",
    },
    {
      icon: Workflow,
      title: "Fragmented Workflow",
      description: "Research, trading, and portfolio management are split across different people and tools, creating delays, inconsistent decisions, and missed opportunities.",
    },
    {
      icon: DollarSign,
      title: "High Cost, Low Access",
      description: "Institutional-grade research and portfolio management remain out of reach for small funds and individuals.",
    },
  ];

  const contentRef = useRef<HTMLDivElement | null>(null);

  return (
    <section className="pt-8 pb-24 px-8 md:px-16 relative overflow-hidden w-full" style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 85%, transparent 100%)', maskImage: 'linear-gradient(to bottom, black 0%, black 85%, transparent 100%)' }}>
      {/* Background image */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/70 to-background">
        <img
          src={heroBg}
          alt="Financial data visualization"
          className="w-full h-full object-cover opacity-40 mix-blend-screen filter contrast-125 brightness-110 saturate-125"
          style={{ objectPosition: '50% 20%', filter: 'hue-rotate(210deg) saturate(1.1) brightness(1.05) contrast(1.15)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)', maskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)' }}
        />
        <div className="absolute inset-0 bg-sky-500/20 mix-blend-multiply pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>
      <div ref={contentRef} className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-16" ref={headerAnimation.ref} style={headerAnimation.style}>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            The Challenge
          </h2>
          <p className="text-xl text-white max-w-2xl mx-auto">
            Traditional stock analysis faces fundamental limitations that prevent efficient, scalable decision-making
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((problem, index) => {
            const Icon = problem.icon;
            const animation = useElementAnimation({
              minY: 30,
              maxY: 70,
              maxScale: 1.05,
              minScale: 0.9,
            });
            
            return (
              <Card 
                key={index}
                ref={animation.ref}
                className="p-8 bg-secondary/30 border-transparent transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]"
                style={animation.style}
              >
                <div className="mb-6 inline-flex p-4 bg-primary/10 rounded-xl">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{problem.title}</h3>
                <p className="text-white leading-relaxed">
                  {problem.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Problem;
