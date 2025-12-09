
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, UNSAFE_future } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { validateConfig } from "@/config";
import Index from "./pages/Index";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";
import StockAnalysis from "./pages/StockAnalysis";
import Output from "./pages/Output";
import NewStockAnalysis from "./pages/NewStockAnalysis";
import NewOutput from "./pages/NewOutput";
import Dashboard from "./pages/Dashboard";
import Charts from "./pages/Charts";
import NotFound from "./pages/NotFound";
import SharedAnalysis from "./pages/SharedAnalysis";

const queryClient = new QueryClient();

const App = () => {
  // Validate configuration on app startup
  React.useEffect(() => {
    validateConfig();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/analysis" 
                element={
                  <ProtectedRoute>
                    <NewStockAnalysis />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/output" 
                element={
                  <ProtectedRoute>
                    <NewOutput />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/charts" 
                element={
                  <ProtectedRoute>
                    <Charts />
                  </ProtectedRoute>
                } 
              />
              {/* Public, shareable analysis route */}
              <Route path="/analysis/:id" element={<SharedAnalysis />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
