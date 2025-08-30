import { Link, useLocation, useNavigate } from "react-router-dom";
import { TrendingUp, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Signed out successfully",
        description: "You have been logged out.",
      });
      navigate("/auth");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <TrendingUp className="h-8 w-8 text-emerald-400" />
            <span className="text-xl font-bold text-white">StockAnalyzer Pro</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to="/analysis" 
              className={`text-sm font-medium transition-colors hover:text-emerald-400 ${
                isActive("/analysis") ? "text-emerald-400" : "text-slate-300"
              }`}
            >
              Analysis
            </Link>
            <Link 
              to="/charts" 
              className={`text-sm font-medium transition-colors hover:text-emerald-400 ${
                isActive("/charts") ? "text-emerald-400" : "text-slate-300"
              }`}
            >
              Charts
            </Link>
            <Link 
              to="/output" 
              className={`text-sm font-medium transition-colors hover:text-emerald-400 ${
                isActive("/output") ? "text-emerald-400" : "text-slate-300"
              }`}
            >
              Results
            </Link>
          </nav>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-300 hover:text-white hover:bg-slate-700 p-2"
            >
              {mobileMenuOpen ? (
                <X className="h-7 w-7" />
              ) : (
                <Menu className="h-7 w-7" />
              )}
            </Button>
          </div>

          {/* Sign in button removed */}
        </div>
      </div>
      
      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-800 border-t border-slate-700 shadow-lg">
          <div className="container mx-auto px-4 py-3 space-y-3">
            <Link 
              to="/analysis" 
              className={`block text-sm font-medium transition-colors hover:text-emerald-400 ${
                isActive("/analysis") ? "text-emerald-400" : "text-slate-300"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Analysis
            </Link>
            <Link 
              to="/charts" 
              className={`block text-sm font-medium transition-colors hover:text-emerald-400 ${
                isActive("/charts") ? "text-emerald-400" : "text-slate-300"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Charts
            </Link>
            <Link 
              to="/output" 
              className={`block text-sm font-medium transition-colors hover:text-emerald-400 ${
                isActive("/output") ? "text-emerald-400" : "text-slate-300"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Results
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
