import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const emailSuggestions = ["@gmail.com", "@yahoo.com"];

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Erro ao entrar: " + error.message);
    } else {
      navigate("/dashboard");
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setShowSuggestions(value.length > 0 && !value.includes("@"));
  };

  const applySuggestion = (domain: string) => {
    const localPart = email.split("@")[0];
    setEmail(localPart + domain);
    setShowSuggestions(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <img src={logo} alt="Relíquia Barber" className="mx-auto w-32 h-32 object-contain" />
          <p className="text-muted-foreground">Faça login para agendar</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              onFocus={() => { if (email.length > 0 && !email.includes("@")) setShowSuggestions(true); }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              required
              className="bg-card border-border text-foreground placeholder:text-muted-foreground"
            />
            {showSuggestions && (
              <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg">
                {emailSuggestions.map((domain) => (
                  <button
                    key={domain}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent"
                    onMouseDown={() => applySuggestion(domain)}
                  >
                    {email.split("@")[0]}{domain}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-card border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="text-center text-muted-foreground text-sm">
          Não tem conta?{" "}
          <Link to="/cadastro" className="text-primary hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
