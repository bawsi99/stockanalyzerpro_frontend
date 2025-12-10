import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface ConsentModalProps {
  open: boolean;
  onAccept: () => void;
}

const ConsentModal = ({ open, onAccept }: ConsentModalProps) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleAccept = () => {
    localStorage.setItem("hasSeenConsentModal", "true");
    onAccept();
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Before You Use StockAnalyzer Pro</DialogTitle>
          <DialogDescription className="pt-4">
            StockAnalyzer Pro is a prototype AI-driven technical research tool made available in a
            private beta. By continuing, you confirm that:
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3">
          <ul className="list-disc list-inside space-y-2 text-sm text-slate-700">
            <li>
              You are accessing the platform for evaluation and feedback purposes.
            </li>
            <li>
              You understand that all outputs are AI-generated, may be incorrect, and are provided
              on an &apos;as is&apos; basis with no guarantees.
            </li>
            <li>
              You will not treat any analysis, entry/exit level, or strategy as a direct
              instruction to trade.
            </li>
            <li>
              You will not publicly redistribute or market the platform&apos;s trade ideas as
              investment advice or tips.
            </li>
            <li>
              You accept that StockAnalyzer Pro and its creators are not responsible for any
              profits or losses arising from your use of the platform.
            </li>
          </ul>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
            Log out
          </Button>
          <Button onClick={handleAccept} className="w-full sm:w-auto">
            Accept & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConsentModal;

