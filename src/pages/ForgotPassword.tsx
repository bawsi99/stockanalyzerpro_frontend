import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Mail, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resetPassword } = useAuth();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await resetPassword(email);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setIsEmailSent(true);
      toast({
        title: "Reset Link Sent",
        description: "Check your email for password reset instructions.",
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-emerald-500/20 rounded-full">
              <TrendingUp className="h-8 w-8 text-emerald-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">Forgot Password</CardTitle>
          <CardDescription className="text-slate-300">
            {isEmailSent 
              ? "Check your email for password reset instructions"
              : "Enter your email address and we'll send you a reset link"
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isEmailSent ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
                <p className="text-emerald-300 text-sm text-center">
                  Password reset link has been sent to <strong className="text-white">{email}</strong>
                </p>
              </div>
              <div className="space-y-2">
                <Button
                  onClick={() => navigate("/login")}
                  className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  Back to Login
                </Button>
                <Button
                  onClick={() => {
                    setIsEmailSent(false);
                    setEmail("");
                  }}
                  variant="outline"
                  className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-emerald-400 transition-colors"
                >
                  Send Another Email
                </Button>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-200">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-400"
                      required
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-white/20">
                <Link 
                  to="/login"
                  className="flex items-center justify-center text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;

