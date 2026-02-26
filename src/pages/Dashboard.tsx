import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import TabAgendar from "@/components/tabs/TabAgendar";
import TabInicio from "@/components/tabs/TabInicio";
import { LocalizacaoTab } from "@/components/tabs/LocalizacaoTab";
import { SuporteTab } from "@/components/tabs/SuporteTab";
import { PagarTab } from "@/components/tabs/PagarTab";
import { PerfilTab } from "@/components/tabs/PerfilTab";
import { User, MapPin, Home, CalendarDays, CreditCard } from "lucide-react";
import type { User as SupaUser } from "@supabase/supabase-js";

const HOTBAR_ITEMS = [
  { id: "perfil", label: "Perfil", icon: User },
  { id: "localizacao", label: "Local", icon: MapPin },
  { id: "inicio", label: "Início", icon: Home },
  { id: "agendamentos", label: "Agendar", icon: CalendarDays },
  { id: "pagar", label: "Pagar", icon: CreditCard },
];

const Dashboard = () => {
  const [user, setUser] = useState<SupaUser | null>(null);
  const [activeTab, setActiveTab] = useState("inicio");
  const navigate = useNavigate();

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarX, setSidebarX] = useState(-280);
  const [dragging, setDragging] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; started: boolean }>({ x: 0, y: 0, started: false });
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Sidebar indicator pulse
  const [showIndicator, setShowIndicator] = useState(!sidebarOpen);
  const [pulsing, setPulsing] = useState(false);
  useEffect(() => {
    const key = "sidebar_pulse_done";
    if (!localStorage.getItem(key)) {
      setPulsing(true);
      const t = setTimeout(() => { setPulsing(false); localStorage.setItem(key, "1"); }, 3000);
      return () => clearTimeout(t);
    }
  }, []);

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

  // Touch/mouse handlers for swipe sidebar
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const x = e.touches[0].clientX;
    if (x <= 20 || sidebarOpen) {
      touchStartRef.current = { x, y: e.touches[0].clientY, started: true };
    }
  }, [sidebarOpen]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current.started) return;
    const dx = e.touches[0].clientX - touchStartRef.current.x;
    setDragging(true);
    if (sidebarOpen) {
      setSidebarX(Math.min(0, Math.max(-280, dx)));
    } else {
      setSidebarX(Math.min(0, Math.max(-280, -280 + dx)));
    }
  }, [sidebarOpen]);

  const handleTouchEnd = useCallback(() => {
    if (!touchStartRef.current.started) return;
    touchStartRef.current.started = false;
    setDragging(false);
    if (sidebarX > -200) {
      setSidebarOpen(true);
      setSidebarX(0);
      setShowIndicator(false);
    } else {
      setSidebarOpen(false);
      setSidebarX(-280);
      setShowIndicator(true);
    }
  }, [sidebarX]);

  useEffect(() => {
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd);
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Mouse swipe for desktop
  const mouseDownRef = useRef(false);
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.clientX <= 20 || sidebarOpen) {
      mouseDownRef.current = true;
      touchStartRef.current = { x: e.clientX, y: e.clientY, started: true };
    }
  }, [sidebarOpen]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!mouseDownRef.current || !touchStartRef.current.started) return;
    const dx = e.clientX - touchStartRef.current.x;
    setDragging(true);
    if (sidebarOpen) {
      setSidebarX(Math.min(0, Math.max(-280, dx)));
    } else {
      setSidebarX(Math.min(0, Math.max(-280, -280 + dx)));
    }
  }, [sidebarOpen]);

  const handleMouseUp = useCallback(() => {
    if (!mouseDownRef.current) return;
    mouseDownRef.current = false;
    touchStartRef.current.started = false;
    setDragging(false);
    if (sidebarX > -200) {
      setSidebarOpen(true);
      setSidebarX(0);
      setShowIndicator(false);
    } else {
      setSidebarOpen(false);
      setSidebarX(-280);
      setShowIndicator(true);
    }
  }, [sidebarX]);

  useEffect(() => {
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp]);

  const closeSidebar = () => {
    setSidebarOpen(false);
    setSidebarX(-280);
    setShowIndicator(true);
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
    <div className="min-h-screen bg-background" style={{ paddingBottom: 80 }}>
      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          onClick={closeSidebar}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 998,
            transition: dragging ? "none" : "opacity 0.3s",
          }}
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        style={{
          position: "fixed", top: 0, bottom: 0, left: 0, width: 280, zIndex: 999,
          transform: `translateX(${sidebarX}px)`,
          transition: dragging ? "none" : "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <AppSidebar activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); closeSidebar(); }} onLogout={handleLogout} />
      </div>

      {/* Sidebar indicator */}
      {showIndicator && !sidebarOpen && (
        <div style={{
          position: "fixed", left: 0, top: "50%", transform: "translateY(-50%)",
          width: pulsing ? undefined : 10, height: 48,
          borderRadius: "0 8px 8px 0",
          background: "#d4af37",
          opacity: 0.35,
          boxShadow: "2px 0 10px rgba(212,175,55,0.3)",
          zIndex: 997,
          pointerEvents: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: pulsing ? "sidebarPulse 1s ease-in-out 3" : "none",
        }}>
          <div style={{ width: 3, height: 22, borderRadius: 2, background: "rgba(0,0,0,0.25)" }} />
        </div>
      )}

      {/* Main content - full width */}
      <main style={{ width: "100%" }}>
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

      {/* Pulse animation */}
      <style>{`
        @keyframes sidebarPulse {
          0%, 100% { width: 10px; opacity: 0.35; box-shadow: 2px 0 10px rgba(212,175,55,0.3); }
          50% { width: 16px; opacity: 0.9; box-shadow: 2px 0 18px rgba(212,175,55,0.6); }
        }
   </style>
    </div>
    </SidebarProvider>
  );
};
export default Dashboard;
