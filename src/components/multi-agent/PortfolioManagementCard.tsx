import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Briefcase } from "lucide-react";

export const PortfolioManagementCard = () => (
  <Card className="bg-gradient-to-br from-card to-secondary/30 border-primary/20 flex items-center justify-center min-h-[140px] relative">
    {/* IN DEVELOPMENT Badge */}
    <div className="absolute top-2 right-2 text-blue-800 text-[10px] font-semibold px-2 py-1 rounded-full">
      IN DEVELOPMENT
    </div>
    <CardHeader className="pb-2 items-center text-center">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-md bg-primary/10">
          <Briefcase className="w-5 h-5 text-accent" />
        </div>
        <CardTitle className="text-xl">Portfolio Management</CardTitle>
      </div>
      <CardDescription>Optimization, rebalancing, risk budgeting</CardDescription>
    </CardHeader>
  </Card>
);
