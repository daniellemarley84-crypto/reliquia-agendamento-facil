import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Users, Calendar, DollarSign, Bell, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Notification {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface TodayAppointment {
  id: string;
  appointment_time: string;
  user_id: string;
  client_name?: string;
  services: { name: string; price: number } | null;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [totalClients, setTotalClients] = useState(0);
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", session.user.id)
        .single();

      if (!profile?.is_admin) { navigate("/dashboard"); return; }

      await loadData();
    };
    checkAdmin();
  }, [navigate]);

  const loadData = async () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd");
    const monthEnd = format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), "yyyy-MM-dd");

    const [clientsRes, todayRes, monthRes, notifRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("appointments").select("id, appointment_time, user_id, services(name, price)").eq("appointment_date", today).order("appointment_time"),
      supabase.from("appointments").select("services(price)").gte("appointment_date", monthStart).lte("appointment_date", monthEnd),
      supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(20),
    ]);

    setTotalClients(clientsRes.count || 0);
    
    // Fetch client names for today's appointments
    const todayData = (todayRes.data as unknown as TodayAppointment[]) || [];
    if (todayData.length > 0) {
      const userIds = [...new Set(todayData.map((a) => a.user_id))];
      const { data: profilesData } = await supabase.from("profiles").select("user_id, name").in("user_id", userIds);
      const nameMap = new Map((profilesData || []).map((p: any) => [p.user_id, p.name]));
      todayData.forEach((a) => { a.client_name = nameMap.get(a.user_id) || "Cliente"; });
    }
    setTodayAppointments(todayData);
    setMonthRevenue(
      (monthRes.data || []).reduce((sum: number, a: any) => sum + (a.services?.price || 0), 0)
    );
    setNotifications((notifRes.data as unknown as Notification[]) || []);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const cancelAppointment = async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-appointment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ appointment_id: id }),
    });

    if (!res.ok) {
      const data = await res.json();
      toast.error("Erro ao cancelar: " + (data.error || "Erro desconhecido"));
    } else {
      toast.success("Agendamento cancelado!");
      setTodayAppointments((prev) => prev.filter((a) => a.id !== id));
      await loadData();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Carregando...</div>;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar onLogout={handleLogout} unreadCount={unreadCount} />
        <main className="flex-1 p-6">
          <header className="flex items-center mb-8">
            <SidebarTrigger className="mr-4" />
            <h2 className="text-2xl font-bold text-foreground">Painel Administrativo</h2>
          </header>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cadastros</p>
                <p className="text-2xl font-bold text-foreground">{totalClients}</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Agendamentos Hoje</p>
                <p className="text-2xl font-bold text-foreground">{todayAppointments.length}</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receita do Mês</p>
                <p className="text-2xl font-bold text-foreground">R$ {monthRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Today's schedule */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" /> Horários de Hoje
              </h3>
              {todayAppointments.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum agendamento para hoje.</p>
              ) : (
                <div className="space-y-3">
                  {todayAppointments.map((a) => (
                    <div key={a.id} className="flex justify-between items-center p-3 bg-background rounded-lg border border-border">
                      <div>
                        <p className="font-medium text-foreground">{a.client_name || "Cliente"}</p>
                        <p className="text-xs text-muted-foreground">{a.services?.name || "Serviço"}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-primary font-semibold">{a.appointment_time}</span>
                        <button
                          onClick={() => cancelAppointment(a.id)}
                          className="text-destructive hover:text-destructive/80 text-xs font-medium"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" /> Notificações
                {unreadCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">{unreadCount}</span>
                )}
              </h3>
              {notifications.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhuma notificação.</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 rounded-lg border text-sm flex justify-between items-start gap-2 ${
                        n.is_read ? "bg-background border-border" : "bg-primary/5 border-primary/20"
                      }`}
                    >
                      <div>
                        <p className="text-foreground">{n.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(n.created_at), "dd/MM HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      {!n.is_read && (
                        <button onClick={() => markAsRead(n.id)} className="text-primary hover:text-primary/80 shrink-0" title="Marcar como lida">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
