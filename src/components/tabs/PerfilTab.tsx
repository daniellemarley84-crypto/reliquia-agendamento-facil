import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User, Lock, Phone, CalendarDays, Hash, XCircle } from "lucide-react";

interface Profile {
  name: string;
  phone: string | null;
  birth_date: string | null;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  services: { name: string } | null;
}

export function PerfilTab({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    const [profileRes, apptRes] = await Promise.all([
      supabase.from("profiles").select("name, phone, birth_date").eq("user_id", userId).single(),
      supabase.from("appointments").select("id, appointment_date, appointment_time, status, services(name)").eq("user_id", userId).order("appointment_date", { ascending: false }),
    ]);
    if (profileRes.data) setProfile(profileRes.data);
    if (apptRes.data) setAppointments(apptRes.data as unknown as Appointment[]);
  };

  const handleCancelAppointment = async (id: string) => {
    const { error } = await supabase.from("appointments").update({ status: "cancelado" }).eq("id", id);
    if (error) {
      toast.error("Erro ao cancelar: " + error.message);
    } else {
      toast.success("Agendamento cancelado!");
      setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status: "cancelado" } : a));
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error("Mínimo 6 caracteres"); return; }
    if (newPassword !== confirmPassword) { toast.error("Senhas não conferem"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success("Senha alterada com sucesso!");
      setShowPasswordModal(false);
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const statusColor = (s: string) => {
    if (s === "confirmado") return "text-green-400";
    if (s === "cancelado") return "text-destructive";
    return "text-muted-foreground";
  };

  if (!profile) return <div className="text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Profile Info */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Meus Dados</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
            <User className="w-4 h-4 text-muted-foreground" />
            <div><p className="text-xs text-muted-foreground">Nome</p><p className="font-medium">{profile.name}</p></div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <div><p className="text-xs text-muted-foreground">Telefone</p><p className="font-medium">{profile.phone || "—"}</p></div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            <div><p className="text-xs text-muted-foreground">Nascimento</p><p className="font-medium">{profile.birth_date ? format(new Date(profile.birth_date + "T00:00:00"), "dd/MM/yyyy") : "—"}</p></div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
            <Hash className="w-4 h-4 text-muted-foreground" />
            <div><p className="text-xs text-muted-foreground">ID</p><p className="font-medium text-xs break-all">{userId}</p></div>
          </div>
        </div>
        <div className="flex justify-center pt-2">
          <Button variant="outline" size="sm" onClick={() => setShowPasswordModal(true)} className="gap-2">
            <Lock className="w-4 h-4" /> Trocar Senha
          </Button>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,.75)", backdropFilter: "blur(4px)", animation: "fadeIn .3s" }}>
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm space-y-4 mx-4" style={{ animation: "slideUp .4s cubic-bezier(.16,1,.3,1)" }}>
            <h3 className="text-lg font-semibold">Trocar Senha</h3>
            <Input type="password" placeholder="Nova senha" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} />
            <Input type="password" placeholder="Confirmar senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            <div className="flex gap-2">
              <Button onClick={handleChangePassword} disabled={loading} className="flex-1">{loading ? "Salvando..." : "Salvar"}</Button>
              <Button variant="outline" onClick={() => setShowPasswordModal(false)} className="flex-1">Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Appointments */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Meus Agendamentos</h3>
        {appointments.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum agendamento.</p>
        ) : (
          <div className="space-y-2">
            {appointments.map((a) => (
              <div key={a.id} className="flex justify-between items-center p-3 bg-card rounded-lg border border-border">
                <div>
                  <p className="font-medium">{a.services?.name || "Serviço"}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(a.appointment_date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })} às {a.appointment_time}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium capitalize ${statusColor(a.status)}`}>{a.status}</span>
                  {a.status === "confirmado" && (
                    <button onClick={() => handleCancelAppointment(a.id)} className="text-destructive hover:text-destructive/80" title="Cancelar">
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
