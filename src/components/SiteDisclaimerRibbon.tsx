import { Link } from "react-router-dom";

interface SiteDisclaimerRibbonProps {
  variant?: "footer" | "header";
}

const SiteDisclaimerRibbon = ({ variant = "footer" }: SiteDisclaimerRibbonProps) => {
  const disclaimerText =
    "StockAnalyzer Pro provides AI-generated technical analysis for research and educational purposes only. It is not SEBI-registered investment advice or a recommendation to buy or sell any securities.";

  if (variant === "header") {
    return (
      <div className="w-full bg-amber-50 border-b border-amber-200 py-2 px-4">
        <p className="text-xs text-amber-800 text-center max-w-6xl mx-auto">
          {disclaimerText}{" "}
          <Link to="/disclaimer" className="underline hover:text-amber-900">
            Learn more
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900/95 border-t border-slate-700 py-3 px-4 mt-8">
      <p className="text-xs text-slate-300 text-center max-w-6xl mx-auto">
        {disclaimerText}{" "}
        <Link to="/disclaimer" className="text-emerald-400 hover:text-emerald-300 underline">
          Disclaimer & Terms
        </Link>
      </p>
    </div>
  );
};

export default SiteDisclaimerRibbon;

