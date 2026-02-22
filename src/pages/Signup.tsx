import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const formatDate = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

const Signup = () => {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    // Parse birth date DD/MM/YYYY to YYYY-MM-DD
    const parts = birthDate.split("/");
    const formattedBirth = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : null;

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setLoading(false);
      toast.error("Erro ao cadastrar: " + error.message);
      return;
    }

    // Update profile with extra fields
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({
        birth_date: formattedBirth,
        phone: phone.replace(/\D/g, ""),
      }).eq("user_id", user.id);
    }

    setLoading(false);
    toast.success("Conta criada! Verifique seu email para confirmar.");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <img src={logo} alt="Relíquia Barber" className="mx-auto w-32 h-32 object-contain" />
          <p className="text-muted-foreground">Crie sua conta</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <Input
            placeholder="Nome Completo *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="bg-card border-border text-foreground placeholder:text-muted-foreground"
          />
          <Input
            placeholder="Data de Nascimento (DD/MM/AAAA)"
            value={birthDate}
            onChange={(e) => setBirthDate(formatDate(e.target.value))}
            className="bg-card border-border text-foreground placeholder:text-muted-foreground"
          />
          <Input
            placeholder="Telefone (85) 99741-0934"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            className="bg-card border-border text-foreground placeholder:text-muted-foreground"
          />
          <Input
            type="email"
            placeholder="Email *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-card border-border text-foreground placeholder:text-muted-foreground"
          />
          <Input
            type="password"
            placeholder="Senha (mín. 6 caracteres) *"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="bg-card border-border text-foreground placeholder:text-muted-foreground"
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Cadastrando..." : "Cadastrar"}
          </Button>
        </form>

        <p className="text-center text-muted-foreground text-sm">
          Já tem conta?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
