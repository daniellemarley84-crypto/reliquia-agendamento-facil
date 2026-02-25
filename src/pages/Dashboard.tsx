import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import TabAgendar from "@/components/tabs/TabAgendar";
import TabInicio from "@/components/tabs/TabInicio";
import { LocalizacaoTab } from "@/components/tabs/LocalizacaoTab";
import { SuporteTab } from "@/components/tabs/SuporteTab";
import { PagarTab } from "@/components/tabs/PagarTab";
import { PerfilTab } from "@/components/tabs/PerfilTab";
import type { User } from "@supabase/supabase-js";

const tabTitles: Record<string, string> = {
  inicio: "Início",
  perfil: "Perfil",
  agendamentos: "Agendar",
  localizacao: "Localização",
  suporte: "Suporte",
  pagar: "Pagar",
};

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("inicio");
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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

  if (!user) return null;

  const renderTab = () => {
    switch (activeTab) {
      case "inicio": return <TabInicio onNavigate={(tab: string) => setActiveTab(tab === "agendar" ? "agendamentos" : tab)} />;
      case "perfil": return <PerfilTab userId={user.id} />;
      case "agendamentos": return <TabAgendar />;
      case "localizacao": return <LocalizacaoTab />;
      case "suporte": return <SuporteTab />;
      case "pagar": return <PagarTab userId={user.id} />;
      default: return <TabInicio onNavigate={(tab: string) => setActiveTab(tab === "agendar" ? "agendamentos" : tab)} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
        <main className="flex-1 p-6">
          <header className="flex items-center mb-6">
            <SidebarTrigger className="mr-4" />
            <h2 className="text-2xl font-bold">{tabTitles[activeTab] || activeTab}</h2>
          </header>
          {renderTab()}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
