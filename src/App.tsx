import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthRedirect({ to }: { to: string }) {
  const [checking, setChecking] = useState(true);
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setTarget(null);
        setChecking(false);
        return;
      }
      const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: session.user.id });
      setTarget(isAdmin ? "/admin" : "/dashboard");
      setChecking(false);
    });
  }, []);

  if (checking) return null;
  if (target) return <Navigate to={target} replace />;
  return <Navigate to={to} replace />;
}

function LoginGuard() {
  const [checking, setChecking] = useState(true);
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setTarget(null);
        setChecking(false);
        return;
      }
      const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: session.user.id });
      setTarget(isAdmin ? "/admin" : "/dashboard");
      setChecking(false);
    });
  }, []);

  if (checking) return null;
  if (target) return <Navigate to={target} replace />;
  return <Login />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthRedirect to="/login" />} />
          <Route path="/login" element={<LoginGuard />} />
          <Route path="/cadastro" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
