import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const AnalysisResultBanner = () => {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if banner was dismissed in this session
    const dismissed = sessionStorage.getItem("analysisBannerDismissed");
    if (dismissed === "true") {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem("analysisBannerDismissed", "true");
    setIsDismissed(true);
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div className="w-full bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-r-lg shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900 mb-2">AI-GENERATED RESEARCH ONLY</h3>
          <p className="text-sm text-amber-800">
            The trade setups, entry/exit levels, and strategies shown here are{" "}
            <strong>AI-generated hypothetical analyses based on historical data</strong>. They are
            not investment advice, not recommendations to buy or sell any securities, and may be
            wrong or incomplete. You remain fully responsible for all trading decisions and risk.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-amber-700 hover:text-amber-900 hover:bg-amber-100 flex-shrink-0"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default AnalysisResultBanner;

