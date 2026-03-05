import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import TabAgendar from "@/components/tabs/TabAgendar";
import TabInicio from "@/components/tabs/TabInicio";
import { LocalizacaoTab } from "@/components/tabs/LocalizacaoTab";
import { SuporteTab } from "@/components/tabs/SuporteTab";
import { PagarTab } from "@/components/tabs/PagarTab";
import { PerfilTab } from "@/components/tabs/PerfilTab";
import { User, MapPin, Home, CalendarDays, CreditCard, Menu } from "lucide-react";
import type { User as SupaUser } from "@supabase/supabase-js";

const HOTBAR_ITEMS = [
  { id: "perfil", label: "Perfil", icon: User },
  { id: "localizacao", label: "Local", icon: MapPin },
  { id: "inicio", label: "Início", icon: Home },
  { id: "agendamentos", label: "Agendar", icon: CalendarDays },
  { id: "pagar", label: "Pagar", icon: CreditCard },
];

function SidebarToggle() {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      onClick={toggleSidebar}
      style={{
        position: "fixed", top: 12, left: 12, zIndex: 1000,
        width: 36, height: 36, borderRadius: 8,
        background: "rgba(13,13,13,0.7)", backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", transition: "all 0.2s",
      }}
    >
      <Menu size={18} color="rgba(255,255,255,0.5)" />
    </button>
  );
}

function DashboardContent({ user, activeTab, setActiveTab, handleLogout }: {
  user: SupaUser; activeTab: string; setActiveTab: (t: string) => void; handleLogout: () => void;
}) {
  const renderTab = () => {
    switch (activeTab) {
      case "inicio": return <TabInicio onNavigate={(tab: string) => setActiveTab(tab === "agendar" ? "agendamentos" : tab)} />;
      case "perfil": return <PerfilTab userId={user.id} />;
      case "agendamentos": return <TabAgendar onGoHome={() => setActiveTab("inicio")} />;
      case "localizacao": return <LocalizacaoTab />;
      case "suporte": return <SuporteTab />;
      case "pagar": return <PagarTab userId={user.id} />;
      default: return <TabInicio onNavigate={(tab: string) => setActiveTab(tab === "agendar" ? "agendamentos" : tab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex w-full" style={{ paddingBottom: 80 }}>
      <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
      <main style={{ width: "100%", flex: 1 }}>
        <SidebarToggle />
        {renderTab()}
      </main>

      {/* Hotbar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, height: 70,
        background: "#0d0d0d", borderTop: "1px solid #222",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "space-around",
        zIndex: 999, fontFamily: "'DM Sans', sans-serif",
      }}>
        {HOTBAR_ITEMS.map(item => {
          const isActive = activeTab === item.id;
          const isCenter = item.id === "inicio";
          const Icon = item.icon;

          if (isCenter) {
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                background: "none", border: "none", cursor: "pointer", padding: 0,
                transform: "translateY(-14px)",
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: "linear-gradient(145deg, #e2c04a, #b8922a)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 0 4px #0d0d0d, 0 4px 18px rgba(212,175,55,0.5)",
                }}>
                  <Icon size={24} color="#0d0d0d" strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#d4af37" }}>{item.label}</span>
              </button>
            );
          }

          return (
            <button key={item.id} onClick={() => setActiveTab(item.id)} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              background: "none", border: "none", cursor: "pointer", padding: "6px 0",
            }}>
              <Icon size={20} color={isActive ? "#d4af37" : "#555"} />
              <span style={{ fontSize: 10, fontWeight: 500, color: isActive ? "#d4af37" : "#555" }}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const Dashboard = () => {
  const [user, setUser] = useState<SupaUser | null>(null);
  const [activeTab, setActiveTab] = useState("inicio");
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/login");
      else setUser(session.user);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/login");
      else setUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (!user) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#0d0d0d", color: "#d4af37", fontSize: 18 }}>
      Carregando...
    </div>
  );

  return (
    <SidebarProvider defaultOpen={false}>
      <DashboardContent user={user} activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} />
    </SidebarProvider>
  );
};
export default Dashboard;
