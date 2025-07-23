
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BarChart3, Shield, Zap, ArrowRight, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-emerald-400" />
              <span className="text-2xl font-bold text-white">StockAnalyzer Pro</span>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link to="/dashboard">
                    <Button variant="outline" className="text-white border-white hover:bg-white hover:text-slate-900">
                      Dashboard
                    </Button>
                  </Link>
                  <Link to="/analysis">
                    <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                      New Analysis
                    </Button>
                  </Link>
                </>
              ) : (
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
              <>
                <Link to="/dashboard">
                  <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-lg px-8 py-4">
                    View Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/analysis">
                  <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white text-lg px-8 py-4">
                    Start Analysis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </>
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

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-slate-900 to-slate-800">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Start Analyzing?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Join thousands of investors making smarter decisions with our platform.
          </p>
          {user ? (
            <Link to="/analysis">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white text-lg px-8 py-4">
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white text-lg px-8 py-4">
                Sign Up Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;
