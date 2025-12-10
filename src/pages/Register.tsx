import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Mail, User, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DATABASE_SERVICE_URL } from "@/config";

const Register = () => {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${DATABASE_SERVICE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          full_name: fullName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || "Registration failed");
      }

      if (data.success) {
        toast({
          title: "Account Created!",
          description: data.message || "Please check your email to set your password.",
        });
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        throw new Error(data.error || "Registration failed");
      }
    } catch (error: any) {
      toast({
        title: "Registration Error",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deleteEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter an email address to delete.",
        variant: "destructive",
      });
      return;
    }

    // Confirm deletion
    if (!window.confirm(`Are you sure you want to delete the account for ${deleteEmail}? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`${DATABASE_SERVICE_URL}/admin/delete-user`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: deleteEmail.trim().toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || "Failed to delete account");
      }

      if (data.success) {
        toast({
          title: "Account Deleted",
          description: data.message || `Account for ${deleteEmail} has been deleted successfully.`,
        });
        setDeleteEmail("");
      } else {
        throw new Error(data.error || "Failed to delete account");
      }
    } catch (error: any) {
      toast({
        title: "Delete Error",
        description: error.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
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
          <CardTitle className="text-2xl font-bold text-white">Admin Panel</CardTitle>
          <CardDescription className="text-slate-300">
            Create or delete user accounts
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Create Account Section */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Create Account</h3>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-slate-200">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter user's full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-400"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter user's email"
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
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </div>

          {/* Delete Account Section */}
          <div className="pt-6 border-t border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">Delete Account</h3>
            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deleteEmail" className="text-slate-200">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="deleteEmail"
                    type="email"
                    placeholder="Enter email to delete"
                    value={deleteEmail}
                    onChange={(e) => setDeleteEmail(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-red-400"
                    required
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                variant="destructive"
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Trash2 className="h-4 w-4 mr-2 inline" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2 inline" />
                    Delete Account
                  </>
                )}
              </Button>
            </form>
          </div>

          <div className="pt-6 border-t border-white/20">
            <p className="text-center text-slate-300 text-sm">
              <Link 
                to="/login" 
                className="text-emerald-400 hover:text-emerald-300 transition-colors font-semibold"
              >
                Back to Login
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;

