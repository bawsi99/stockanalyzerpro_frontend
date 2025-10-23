import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, CheckCircle, Users, Rocket } from "lucide-react";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import { useElementAnimation } from "@/hooks/use-element-animation";

const Traction = () => {
  const headerAnimation = useElementAnimation({
    minY: 25,
    maxY: 75,
    maxScale: 1.05,
    minScale: 0.92,
  });
  
  const card1Animation = useElementAnimation({
    minY: 30,
    maxY: 70,
    maxScale: 1.05,
    minScale: 0.9,
  });
  
  const card2Animation = useElementAnimation({
    minY: 30,
    maxY: 70,
    maxScale: 1.05,
    minScale: 0.9,
  });
  
  const card3Animation = useElementAnimation({
    minY: 30,
    maxY: 70,
    maxScale: 1.05,
    minScale: 0.9,
  });
  
  const ctaAnimation = useElementAnimation({
    minY: 30,
    maxY: 70,
    maxScale: 1.05,
    minScale: 0.9,
  });
  
  const achievements = [
    {
      icon: CheckCircle,
      title: "Live Analysis Service",
      description: "Technical Analysis Agent operational at stockanalyzerpro.com",
    },
    {
      icon: Users,
      title: "User Engagement",
      description: "Early retail and institutional users validating analysis quality",
    },
    {
      icon: Rocket,
      title: "Development Pipeline",
      description: "4 additional agents expanding service capabilities",
    },
  ];

  return (
    <section className="py-24 px-8 md:px-16 relative overflow-hidden w-full -mt-20" style={{ WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)', maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)' }}>
      {/* Background image */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/70 to-background">
        <img
          src={heroBg}
          alt="Financial data visualization"
          className="w-full h-full object-cover opacity-40 mix-blend-screen filter contrast-125 brightness-110 saturate-125"
          style={{ objectPosition: '50% 60%', filter: 'hue-rotate(340deg) saturate(1.25) brightness(0.92) contrast(1.2) blur(6px)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)', maskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)' }}
        />
        <div className="absolute inset-0 bg-red-500/25 mix-blend-multiply pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-16" ref={headerAnimation.ref} style={headerAnimation.style}>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Early Traction
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Building momentum with live services and growing user validation
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {achievements.map((item, index) => {
            const Icon = item.icon;
            const cardAnimation = index === 0 ? card1Animation : index === 1 ? card2Animation : card3Animation;
            return (
              <Card 
                key={index}
                ref={cardAnimation.ref}
                className="p-8 text-center bg-gradient-to-br from-card to-secondary/20 border-transparent transition-all duration-300"
                style={cardAnimation.style}
              >
                <div className="inline-flex p-4 bg-primary/10 rounded-full mb-4">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <Card className="p-8 md:p-12 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30 inline-block" ref={ctaAnimation.ref} style={ctaAnimation.style}>
            <h3 className="text-2xl font-bold mb-4">
              Experience Live Technical Analysis
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl">
              See our AI-powered technical analysis agent in action. Analyze stocks from NSE 
              with institutional-grade insights powered by our multi-agent system.
            </p>
            <Link to="/analysis">
              <Button variant="hero" size="lg" className="group">
                Try Analysis Now
                <ExternalLink className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Traction;
