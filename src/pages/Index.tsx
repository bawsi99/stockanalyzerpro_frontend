
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BarChart3, Shield, Zap, ArrowRight, LogIn, User, Mail, Phone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-emerald-400" />
              <span className="text-2xl font-bold text-white">StockAnalyzer Pro</span>
            </div>
            <div className="flex items-center space-x-4">
              {!user && (
                <Link to="/auth">
                  <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="h-16" />
      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-slate-800 mb-6">
            Advanced Stock Analysis
            <span className="text-emerald-600"> Made Simple</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Leverage cutting-edge AI and technical analysis to make informed investment decisions. 
            Analyze stocks with professional-grade tools and insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link to="/analysis">
                <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white text-lg px-8 py-4">
                  Start Analysis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white text-lg px-8 py-4">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-800 mb-12">
            Why Choose StockAnalyzer Pro?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="shadow-lg border-0 bg-gradient-to-br from-emerald-50 to-blue-50">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-emerald-500 mb-4" />
                <CardTitle className="text-slate-800">Advanced Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600">
                  Get comprehensive technical analysis with multiple indicators, trend analysis, and AI-powered insights.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-purple-50">
              <CardHeader>
                <Shield className="h-12 w-12 text-blue-500 mb-4" />
                <CardTitle className="text-slate-800">Risk Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600">
                  Built-in risk assessment tools with stop-loss recommendations and portfolio optimization features.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-pink-50">
              <CardHeader>
                <Zap className="h-12 w-12 text-purple-500 mb-4" />
                <CardTitle className="text-slate-800">Real-time Data</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600">
                  Access live market data and get instant analysis results with our powerful backend infrastructure.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Founder's Profile Section */}
      <section className="pt-2 pb-0 bg-gradient-to-r from-slate-900 to-slate-800">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-3xl rounded-lg p-6 bg-transparent">
            <div className="flex flex-nowrap items-center justify-center gap-8 whitespace-nowrap">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                  <User className="h-5 w-5 text-emerald-300" />
                </div>
                <div className="text-left">
                  <p className="text-white text-lg font-semibold leading-tight">Aaryan Manawat</p>
                  <p className="text-slate-300 text-xs">Founder</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-emerald-300" />
                <a href="tel:+919321536130" className="text-slate-200 hover:text-white">+91 9321536130</a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-emerald-300" />
                <a href="mailto:aaryanmanawar99@gmail.com" className="text-slate-200 hover:text-white">aaryanmanawar99@gmail.com</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
