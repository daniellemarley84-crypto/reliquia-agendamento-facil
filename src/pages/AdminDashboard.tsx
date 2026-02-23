import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Users, Calendar, DollarSign, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ServicosAdminTab } from "@/components/tabs/ServicosAdminTab";
import { GanhosTab } from "@/components/tabs/GanhosTab";
import { PagarAdminTab } from "@/components/tabs/PagarAdminTab";

interface TodayAppointment {
  id: string;
  appointment_time: string;
  appointment_date: string;
  user_id: string;
  status: string;
  client_name?: string;
  services: { name: string; price: number } | null;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [totalClients, setTotalClients] = useState(0);
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("is_admin").eq("user_id", session.user.id).single();
      if (!profile?.is_admin) { navigate("/dashboard"); return; }
      await loadData();
    };
    checkAdmin();
  }, [navigate]);

  const loadData = async () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd");
    const monthEnd = format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), "yyyy-MM-dd");

    const [clientsRes, todayRes, monthRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("appointments").select("id, appointment_time, appointment_date, user_id, status, services(name, price)").eq("appointment_date", today).eq("status", "confirmado").order("appointment_time"),
      supabase.from("appointments").select("services(price)").gte("appointment_date", monthStart).lte("appointment_date", monthEnd).eq("status", "confirmado"),
    ]);

    setTotalClients(clientsRes.count || 0);

    const todayData = (todayRes.data as unknown as TodayAppointment[]) || [];
    if (todayData.length > 0) {
      const userIds = [...new Set(todayData.map((a) => a.user_id))];
      const { data: profilesData } = await supabase.from("profiles").select("user_id, name").in("user_id", userIds);
      const nameMap = new Map((profilesData || []).map((p: any) => [p.user_id, p.name]));
      todayData.forEach((a) => { a.client_name = nameMap.get(a.user_id) || "Cliente"; });
    }
    setTodayAppointments(todayData);
    setMonthRevenue((monthRes.data || []).reduce((sum: number, a: any) => sum + (a.services?.price || 0), 0));
    setLoading(false);
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

  const tabTitles: Record<string, string> = { dashboard: "Painel Administrativo", servicos: "Serviços", ganhos: "Ganhos", pagar: "Pagar" };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
        <main className="flex-1 p-6">
          <header className="flex items-center mb-8">
            <SidebarTrigger className="mr-4" />
            <h2 className="text-2xl font-bold text-foreground">{tabTitles[activeTab]}</h2>
          </header>

          {activeTab === "dashboard" && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><Users className="w-6 h-6 text-primary" /></div>
                  <div><p className="text-sm text-muted-foreground">Cadastros</p><p className="text-2xl font-bold text-foreground">{totalClients}</p></div>
                </div>
                <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><Calendar className="w-6 h-6 text-primary" /></div>
                  <div><p className="text-sm text-muted-foreground">Agendamentos Hoje</p><p className="text-2xl font-bold text-foreground">{todayAppointments.length}</p></div>
                </div>
                <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><DollarSign className="w-6 h-6 text-primary" /></div>
                  <div><p className="text-sm text-muted-foreground">Receita do Mês</p><p className="text-2xl font-bold text-foreground">R$ {monthRevenue.toFixed(2)}</p></div>
                </div>
              </div>

              {/* Today's Appointments - Accordion */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" /> Horários de Hoje
                </h3>
                {todayAppointments.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Nenhum agendamento para hoje.</p>
                ) : (
                  <div className="space-y-2">
                    {todayAppointments.map((a) => (
                      <div key={a.id} className="bg-background rounded-lg border border-border overflow-hidden">
                        <button
                          onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                          className="w-full flex justify-between items-center p-3 text-left hover:bg-accent/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-primary font-semibold">{a.appointment_time}</span>
                            <span className="font-medium text-foreground">{a.client_name || "Cliente"}</span>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedId === a.id ? "rotate-180" : ""}`} />
                        </button>
                        {expandedId === a.id && (
                          <div className="px-3 pb-3 space-y-2 animate-fade-in border-t border-border pt-3">
                            <p className="text-sm"><span className="text-muted-foreground">Cliente:</span> {a.client_name}</p>
                            <p className="text-sm"><span className="text-muted-foreground">Serviço:</span> {a.services?.name || "—"}</p>
                            <p className="text-sm"><span className="text-muted-foreground">Horário:</span> {a.appointment_time}</p>
                            <p className="text-sm"><span className="text-muted-foreground">Data:</span> {format(new Date(a.appointment_date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })}</p>
                            <button
                              onClick={() => cancelAppointment(a.id)}
                              className="text-destructive hover:text-destructive/80 text-xs font-medium mt-1"
                            >
                              Cancelar Agendamento
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === "servicos" && <ServicosAdminTab />}
          {activeTab === "ganhos" && <GanhosTab />}
          {activeTab === "pagar" && <PagarAdminTab />}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
