
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

const ActionButtonsSection = () => {
  return (
    <div className="mt-8">
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
