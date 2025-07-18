import { Link, useLocation, useNavigate } from "react-router-dom";
import { TrendingUp, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  
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
    <header className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <TrendingUp className="h-8 w-8 text-emerald-400" />
            <span className="text-xl font-bold text-white">StockAnalyzer Pro</span>
          </Link>
          
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
              to="/output" 
              className={`text-sm font-medium transition-colors hover:text-emerald-400 ${
                isActive("/output") ? "text-emerald-400" : "text-slate-300"
              }`}
            >
              Results
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-slate-300 hover:text-white hover:bg-slate-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
