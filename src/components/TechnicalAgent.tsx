import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const TechnicalAgent = () => {
  const subAgents = [
    "Indicator Agent - Analyzes different technical indicators",
    "Pattern Agent - Identifies chart patterns and formations",
    "ML Pattern Success Scoring - Predicts pattern success probability",
    "Sector Agent - Sector benchmarking and correlation analysis",
    "Market Index Agent - Market index benchmarking",
    "Multi-Timeframe Agent - Analyzes multiple timeframes for context",
    "Risk Scoring - Risk assessment, scenario analysis, and stress testing",
    "ML Quant Scoring - Supports price predictions with quantitative models",
    "Final Decision Agent - Synthesizes all agent insights for final recommendation",
  ];

  return (
    <section className="py-24 px-8 md:px-16 relative overflow-hidden w-full -mt-20" style={{ WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)', maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)' }}>
      {/* Background image */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/70 to-background">
        <img
          src={heroBg}
          alt="Financial data visualization"
          className="w-full h-full object-cover opacity-40 mix-blend-screen filter contrast-125 brightness-110 saturate-125"
          style={{ objectPosition: '50% 60%', filter: 'hue-rotate(200deg) saturate(1.25) brightness(0.9) contrast(1.2) blur(6px)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)', maskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)' }}
        />
        <div className="absolute inset-0 bg-sky-500/25 mix-blend-multiply pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-sm font-medium mb-6">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400">LIVE - Proof of Concept</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Technical Analysis Agent
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A sophisticated multi-layered system of specialized sub-agents working in harmony 
            to deliver comprehensive technical analysis
          </p>
        </div>

        <Card className="p-8 md:p-12 bg-card border-primary/20">
          <div className="grid md:grid-cols-2 gap-6">
            {subAgents.map((agent, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-foreground leading-relaxed">{agent}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 p-6 bg-primary/5 border border-primary/20 rounded-xl">
            <p className="text-center text-muted-foreground">
              <span className="font-semibold text-foreground">All sub-agents work together</span> to provide 
              the Final Decision Agent with comprehensive insights, enabling accurate buy, sell, or hold recommendations 
              with confidence scores and risk assessments.
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default TechnicalAgent;
