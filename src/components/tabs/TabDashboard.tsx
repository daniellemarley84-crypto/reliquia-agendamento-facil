import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const T = {
  bg1:   "#0e0d0a",
  bg2:   "#141210",
  bg3:   "#1c1a15",
  bg4:   "#242018",
  gold:  "#c9a84c",
  goldL: "#f0d080",
  goldD: "#7a5f25",
  red:   "#c84040",
  green: "#50a850",
  text:  "#e8dfc8",
  textM: "#9a8c70",
  textD: "#5a4e38",
  border:"#2a2418",
  DM:    "'DM Sans', sans-serif",
};

const statusColor = (s: string) => s === "confirmado" ? T.green : s === "cancelado" ? T.red : T.gold;

interface AgendaItem {
  hora: string;
  cliente: string;
  servico: string;
  valor: string;
  status: string;
}

export default function TabDashboard() {
  const [ativos, setAtivos] = useState(0);
  const [banidos, setBanidos] = useState(0);
  const [agendaHoje, setAgendaHoje] = useState<AgendaItem[]>([]);
  const [faturamento, setFaturamento] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Count profiles (all are "ativo" since we don't have a ban field yet)
        const { count: totalProfiles } = await supabase.from("profiles").select("*", { count: "exact", head: true });
        setAtivos(totalProfiles || 0);
        setBanidos(0);

        // Today's appointments
        const today = new Date().toISOString().split("T")[0];
        const { data: appts } = await supabase
          .from("appointments")
          .select("appointment_time, status, combo, service_id, user_id")
          .eq("appointment_date", today);

        if (appts && appts.length > 0) {
          // Get service details
          const serviceIds = [...new Set(appts.map(a => a.service_id))];
          const { data: services } = await supabase.from("services").select("id, name, price").in("id", serviceIds);
          const serviceMap = new Map((services || []).map(s => [s.id, s]));

          // Get user names
          const userIds = [...new Set(appts.map(a => a.user_id))];
          const { data: profiles } = await supabase.from("profiles").select("user_id, name").in("user_id", userIds);
          const profileMap = new Map((profiles || []).map(p => [p.user_id, p.name]));

          const items: AgendaItem[] = appts.map(a => {
            const svc = serviceMap.get(a.service_id);
            return {
              hora: a.appointment_time,
              cliente: profileMap.get(a.user_id) || "Cliente",
              servico: svc?.name || "Serviço",
              valor: `R$${Number(svc?.price || 0).toFixed(0)}`,
              status: a.status,
            };
          }).sort((a, b) => a.hora.localeCompare(b.hora));

          setAgendaHoje(items);

          const fat = appts
            .filter(a => a.status === "confirmado")
            .reduce((sum, a) => sum + Number(serviceMap.get(a.service_id)?.price || 0), 0);
          setFaturamento(fat);
        } else {
          setAgendaHoje([]);
          setFaturamento(0);
        }
      } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const stats = [
    { label:"Clientes Ativos",   value: ativos,               icon:"👤", color: T.green  },
    { label:"Contas Banidas",    value: banidos,               icon:"🚫", color: T.red    },
    { label:"Agenda Hoje",       value: agendaHoje.length,     icon:"📅", color: T.gold   },
    { label:"Faturamento / Dia", value:`R$${faturamento}`,     icon:"💰", color: T.goldL  },
  ];

  return (
    <div style={{ background:T.bg1, minHeight:"100%", fontFamily:T.DM, color:T.text }}>

      {/* Header */}
      <div style={{ background:`linear-gradient(135deg,#1c1200 0%,${T.bg2} 100%)`, borderBottom:`1px solid ${T.border}`, padding:"24px 28px 20px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-30, right:-30, width:140, height:140, borderRadius:"50%", background:"radial-gradient(circle,#c9a84c18 0%,transparent 70%)", pointerEvents:"none" }} />
        <div style={{ fontSize:11, letterSpacing:"0.18em", textTransform:"uppercase", color:T.goldD, fontWeight:700, marginBottom:4 }}>Painel</div>
        <div style={{ fontSize:18, fontWeight:800, color:T.gold, letterSpacing:"0.04em" }}>Visão Geral</div>
        <div style={{ fontSize:11, color:T.textD, letterSpacing:"0.12em", textTransform:"uppercase", marginTop:2 }}>Resumo do negócio em tempo real</div>
      </div>

      <div style={{ padding:"24px 24px 40px" }}>

        {loading ? (
          <div style={{ textAlign:"center", padding:"40px 0", color:T.textD, fontSize:12 }}>Carregando...</div>
        ) : (
          <>
            {/* Cards métricas */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:28 }}>
              {stats.map(s => (
                <div key={s.label} style={{ background:T.bg3, border:`1px solid ${T.border}`, borderRadius:12, padding:"16px 14px", position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", top:-10, right:-10, width:52, height:52, borderRadius:"50%", background:`${s.color}14`, pointerEvents:"none" }} />
                  <div style={{ fontSize:20, marginBottom:8 }}>{s.icon}</div>
                  <div style={{ fontSize:24, fontWeight:800, color:s.color, lineHeight:1, marginBottom:4 }}>{s.value}</div>
                  <div style={{ fontSize:10, color:T.textD, letterSpacing:"0.1em", textTransform:"uppercase", fontWeight:600 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Agenda de hoje */}
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase", color:T.gold }}>📋 Agenda de hoje</span>
              <div style={{ flex:1, height:1, background:`linear-gradient(to right,${T.goldD},transparent)` }} />
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {agendaHoje.length === 0 ? (
                <div style={{ textAlign:"center", padding:"30px 0", color:T.textD, fontSize:12 }}>Nenhum agendamento hoje</div>
              ) : agendaHoje.map((a, i) => (
                <div key={i} style={{ background:T.bg3, border:`1px solid ${T.border}`, borderRadius:10, padding:"12px 14px", display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.textM, width:38, flexShrink:0 }}>{a.hora}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.cliente}</div>
                    <div style={{ fontSize:11, color:T.textD, marginTop:1 }}>{a.servico}</div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.goldL }}>{a.valor}</div>
                    <div style={{ fontSize:10, color:statusColor(a.status), fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", marginTop:1 }}>{a.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
