import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { ServicosAdminTab } from "@/components/tabs/ServicosAdminTab";
import { GanhosTab } from "@/components/tabs/GanhosTab";
import TabDashboard from "@/components/tabs/TabDashboard";
import TabAgendamentos from "@/components/tabs/TabAgendamentos";
import TabCadastrantes from "@/components/tabs/TabCadastrantes";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    let mounted = true;

    const checkAdmin = async () => {
      setLoading(true);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (sessionError || !session) {
        navigate("/login");
        return;
      }

      const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin", {
        _user_id: session.user.id,
      });

      if (!mounted) return;

      if (adminError || !isAdmin) {
        navigate("/dashboard");
        return;
      }

      setLoading(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/login");
    });

    checkAdmin();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Carregando...</div>;

  const tabTitles: Record<string, string> = { dashboard: "Dashboard", agendamentos: "Agendamentos", cadastrantes: "Cadastros", servicos: "Serviços", ganhos: "Ganhos", carousel: "Carrossel" };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
        <main className="flex-1">
          <header className="flex items-center p-6 pb-0">
            <SidebarTrigger className="mr-4" />
            <h2 className="text-2xl font-bold text-foreground">{tabTitles[activeTab]}</h2>
          </header>

          <div className="flex-1">
            {activeTab === "dashboard" && <TabDashboard />}
            {activeTab === "agendamentos" && <TabAgendamentos />}
            {activeTab === "cadastrantes" && <TabCadastrantes />}
            {activeTab === "servicos" && <ServicosAdminTab />}
            {activeTab === "ganhos" && <GanhosTab />}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
