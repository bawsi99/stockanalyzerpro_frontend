
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

const ActionButtonsSection = () => {
  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
      <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
        <Download className="h-4 w-4 mr-2" />
        Download Full Report
      </Button>
      
      <Link to="/analysis" className="block">
        <Button variant="outline" className="w-full border-blue-500 text-blue-500 hover:bg-blue-50">
          <RefreshCw className="h-4 w-4 mr-2" />
          New Analysis
        </Button>
      </Link>
    </div>
  );
};

export default ActionButtonsSection;
