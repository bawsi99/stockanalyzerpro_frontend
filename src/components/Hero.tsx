import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import { useElementAnimation } from "@/hooks/use-element-animation";

const Hero = () => {
  const titleAnimation = useElementAnimation({
    minY: 20,
    maxY: 80,
    maxScale: 1.05,
    minScale: 0.95,
  });
  
  const subtitleAnimation = useElementAnimation({
    minY: 25,
    maxY: 75,
    maxScale: 1.03,
    minScale: 0.97,
  });
  
  const buttonsAnimation = useElementAnimation({
    minY: 30,
    maxY: 70,
    maxScale: 1.05,
    minScale: 0.95,
  });
  
  const statsAnimation = useElementAnimation({
    minY: 35,
    maxY: 65,
    maxScale: 1.05,
    minScale: 0.95,
  });
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/70 to-background">
        <img 
          src={heroBg} 
          alt="Financial data visualization" 
          className="w-full h-full object-cover opacity-40 mix-blend-screen filter contrast-125 brightness-110 saturate-125"
          style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 75%, transparent 100%)', maskImage: 'linear-gradient(to bottom, black 0%, black 75%, transparent 100%)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
      </div>


      {/* Content */}
      <div className="relative z-10 w-full max-w-none pt-24 pb-8 text-center px-8 md:px-16">
        <div className="w-full max-w-none space-y-8">
          <div ref={titleAnimation.ref} style={titleAnimation.style}>
            <h2 className="text-6xl md:text-8xl font-bold tracking-wider mb-8 -mt-20" style={{
              textShadow: 'inset 0 4px 8px rgba(0,0,0,0.6), inset 0 -2px 4px rgba(0,0,0,0.3), 0 2px 0 rgba(255,255,255,0.15)',
              filter: 'brightness(1.0) contrast(1.2)',
              color: 'white'
            }}>
              STOCKANALYZER <span style={{ color: '#FFD700' }}>PRO</span>
            </h2>

            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-[length:300%_300%] bg-clip-text text-transparent animate-gradient">
                Advanced Stock Analysis
              </span>
              <br />
              Made Simple
            </h1>
          </div>

          <div ref={subtitleAnimation.ref} style={subtitleAnimation.style}>
            <p className="text-xl md:text-2xl text-white">
              Leverage cutting-edge AI and autonomous multi-agent systems to make informed investment decisions. 
              Analyze entire stock exchanges in real-time.
            </p>
          </div>

          <div className="flex flex-col items-center gap-6 pt-8" ref={buttonsAnimation.ref} style={buttonsAnimation.style}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/50 backdrop-blur-sm border border-primary/20 rounded-full text-sm font-medium">
              <Zap className="w-4 h-4 text-accent" />
              <span>Live Technical Analysis Agent Now Available</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/analysis">
                <Button variant="hero" size="lg" className="group">
                  Start Analysis
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button variant="outline" size="lg">
                Watch Demo
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 w-full" ref={statsAnimation.ref} style={statsAnimation.style}>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-accent">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold">5+</div>
              <div className="text-sm text-white">AI Agents</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-accent">
                <Shield className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold">Real-time</div>
              <div className="text-sm text-white">Market Analysis</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-accent">
                <Zap className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold">NSE</div>
              <div className="text-sm text-white">Market Coverage</div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
};

export default Hero;
