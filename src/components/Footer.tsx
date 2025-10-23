import { Mail, Phone, TrendingUp } from "lucide-react";
import { useElementAnimation } from "@/hooks/use-element-animation";
import { useRef } from "react";
import heroBg from "@/assets/hero-bg.jpg";

const Footer = () => {
  const leftColumnAnimation = useElementAnimation({
    minY: 30,
    maxY: 70,
    maxScale: 1.05,
    minScale: 0.92,
  });
  
  const rightColumnAnimation = useElementAnimation({
    minY: 30,
    maxY: 70,
    maxScale: 1.05,
    minScale: 0.92,
  });
  
  const contentRef = useRef<HTMLDivElement | null>(null);

  return (
    <footer className="py-16 px-8 md:px-16 w-full relative overflow-hidden -mt-16" style={{ WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 100%)', maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 100%)' }}>
      {/* Background image */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/70 to-background">
        <img
          src={heroBg}
          alt="Financial data visualization"
          className="w-full h-full object-cover opacity-30 mix-blend-screen filter contrast-125 brightness-110 saturate-125"
          style={{ objectPosition: '50% 85%', filter: 'hue-rotate(280deg) saturate(1.2) brightness(0.95) contrast(1.15) blur(16px)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 100%)', maskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 100%)' }}
        />
        <div className="absolute inset-0 bg-black/40 mix-blend-multiply pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>
      <div ref={contentRef} className="container mx-auto max-w-6xl relative z-10">
        <div className="grid md:grid-cols-2 gap-12 mb-12">
          <div ref={leftColumnAnimation.ref} style={leftColumnAnimation.style}>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-primary/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <span className="text-2xl font-bold">StockAnalyzer Pro</span>
            </div>
            <p className="text-muted-foreground mb-6 max-w-md">
              Autonomous AI trading analysis and asset management platform powered by 
              a coordinated multi-agent system.
            </p>
          </div>

          <div ref={rightColumnAnimation.ref} style={rightColumnAnimation.style}>
            <h3 className="text-xl font-bold mb-4">Get in Touch</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <a 
                  href="mailto:aaryanmanawat99@gmail.com" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  aaryanmanawat99@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <a 
                  href="tel:+919321536130" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  +91 9321536130
                </a>
              </div>
            </div>
            <div className="mt-6">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Aaryan Manawat</span>
                <br />
                Founder & CEO
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© 2025 StockAnalyzer Pro. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
