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

const statusColor = (s: string) => s === "confirmado" ? T.green : T.gold;
const FILTROS = ["todos", "confirmado", "pendente"];

interface Agendamento {
  id: string;
  cliente: string;
  servico: string;
  data: string;
  hora: string;
  valor: string;
  status: string;
}

export default function TabAgendamentos() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [filtro, setFiltro] = useState("todos");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: appts } = await supabase
        .from("appointments")
        .select("id, appointment_date, appointment_time, status, combo, service_id, user_id")
        .order("appointment_date", { ascending: false })
        .limit(100);

      if (appts && appts.length > 0) {
        const serviceIds = [...new Set(appts.map(a => a.service_id))];
        const userIds = [...new Set(appts.map(a => a.user_id))];
        
        const { data: services } = await supabase.from("services").select("id, name, price").in("id", serviceIds);
        const { data: profiles } = await supabase.from("profiles").select("user_id, name").in("user_id", userIds);
        
        const serviceMap = new Map((services || []).map(s => [s.id, s]));
        const profileMap = new Map((profiles || []).map(p => [p.user_id, p.name]));

        setAgendamentos(appts.map(a => {
          const svc = serviceMap.get(a.service_id);
          const [y, m, d] = a.appointment_date.split("-");
          return {
            id: a.id,
            cliente: profileMap.get(a.user_id) || "Cliente",
            servico: svc?.name || "Serviço",
            data: `${d}/${m}/${y}`,
            hora: a.appointment_time,
            valor: `R$${Number(svc?.price || 0).toFixed(0)}`,
            status: a.status,
          };
        }));
      } else {
        setAgendamentos([]);
      }
    } catch (err) {
      console.error("Erro ao carregar agendamentos:", err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const visible = agendamentos.filter(a => filtro === "todos" || a.status === filtro);

  const cancelar = async (id: string) => {
    await supabase.from("appointments").delete().eq("id", id);
    setAgendamentos(prev => prev.filter(a => a.id !== id));
  };

  const confirmar = async (id: string) => {
    await supabase.from("appointments").update({ status: "confirmado" }).eq("id", id);
    setAgendamentos(prev => prev.map(a => a.id === id ? { ...a, status: "confirmado" } : a));
  };

  const totalFiltro = visible.length;
  const totalValor = visible
    .filter(a => a.status === "confirmado")
    .reduce((s, a) => s + parseInt(a.valor.replace("R$", "")), 0);

  return (
    <div style={{ background:T.bg1, minHeight:"100%", fontFamily:T.DM, color:T.text }}>

      {/* Header */}
      <div style={{ background:`linear-gradient(135deg,#001a0a 0%,${T.bg2} 60%)`, borderBottom:`1px solid #1a3a2a`, padding:"24px 28px 20px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-30, right:-30, width:140, height:140, borderRadius:"50%", background:"radial-gradient(circle,#50a85020 0%,transparent 70%)", pointerEvents:"none" }} />
        <div style={{ fontSize:11, letterSpacing:"0.18em", textTransform:"uppercase", color:"#2a5a3a", fontWeight:700, marginBottom:4 }}>Gestão</div>
        <div style={{ fontSize:18, fontWeight:800, color:T.goldL, letterSpacing:"0.04em" }}>Agendamentos</div>
        <div style={{ fontSize:11, color:T.textD, letterSpacing:"0.12em", textTransform:"uppercase", marginTop:2 }}>Todos os agendamentos registrados</div>
      </div>

      {/* Mini métricas */}
      <div style={{ display:"flex", gap:10, padding:"16px 24px 4px" }}>
        <div style={{ flex:1, background:T.bg3, border:`1px solid ${T.border}`, borderRadius:10, padding:"10px 12px" }}>
          <div style={{ fontSize:18, fontWeight:800, color:T.gold }}>{totalFiltro}</div>
          <div style={{ fontSize:10, color:T.textD, letterSpacing:"0.08em", textTransform:"uppercase", marginTop:2 }}>Registros</div>
        </div>
        <div style={{ flex:1, background:T.bg3, border:`1px solid ${T.border}`, borderRadius:10, padding:"10px 12px" }}>
          <div style={{ fontSize:18, fontWeight:800, color:T.green }}>R${totalValor}</div>
          <div style={{ fontSize:10, color:T.textD, letterSpacing:"0.08em", textTransform:"uppercase", marginTop:2 }}>Confirmados</div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", padding:"14px 24px 12px" }}>
        {FILTROS.map(f => (
          <button key={f}
            style={{ fontSize:11, letterSpacing:"0.08em", textTransform:"uppercase", padding:"5px 12px", borderRadius:999, border:`1px solid ${filtro===f ? T.gold : T.border}`, background: filtro===f ? T.gold : T.bg4, color: filtro===f ? T.bg1 : T.textD, cursor:"pointer", fontFamily:T.DM, fontWeight:600, transition:"all 0.15s" }}
            onClick={() => setFiltro(f)}
          >{f}</button>
        ))}
      </div>

      {/* Lista */}
      <div style={{ display:"flex", flexDirection:"column", gap:8, padding:"4px 24px 32px" }}>
        {loading && <div style={{ textAlign:"center", padding:"40px 0", color:T.textD, fontSize:12 }}>Carregando...</div>}
        {!loading && visible.length === 0 && (
          <div style={{ textAlign:"center", padding:"40px 0", color:T.textD, fontSize:12, letterSpacing:"0.1em", textTransform:"uppercase" }}>Nenhum agendamento</div>
        )}

        {visible.map(a => (
          <div key={a.id} style={{ background:T.bg3, border:`1px solid ${T.border}`, borderRadius:10, padding:"14px 16px" }}>

            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8, marginBottom:10 }}>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{a.cliente}</div>
                <div style={{ fontSize:11, color:T.textD, marginTop:2 }}>{a.servico}</div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ fontSize:15, fontWeight:800, color:T.goldL }}>{a.valor}</div>
                <div style={{ display:"flex", alignItems:"center", gap:4, justifyContent:"flex-end", marginTop:3 }}>
                  <div style={{ width:5, height:5, borderRadius:"50%", background:statusColor(a.status), boxShadow:`0 0 4px ${statusColor(a.status)}` }} />
                  <span style={{ fontSize:10, fontWeight:700, color:statusColor(a.status), textTransform:"uppercase", letterSpacing:"0.06em" }}>{a.status}</span>
                </div>
              </div>
            </div>

            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
              <div style={{ fontSize:11, color:T.textM }}>📅 {a.data} &nbsp;·&nbsp; 🕐 {a.hora}</div>
              {a.status === "pendente" && (
                <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                  <button
                    style={{ fontSize:10, letterSpacing:"0.06em", textTransform:"uppercase", background:"transparent", border:`1px solid ${T.green}`, color:T.green, padding:"4px 10px", borderRadius:4, cursor:"pointer", fontFamily:T.DM, fontWeight:600 }}
                    onClick={() => confirmar(a.id)}
                  >✓ Confirmar</button>
                  <button
                    style={{ fontSize:10, letterSpacing:"0.06em", textTransform:"uppercase", background:"transparent", border:`1px solid ${T.red}`, color:T.red, padding:"4px 10px", borderRadius:4, cursor:"pointer", fontFamily:T.DM, fontWeight:600 }}
                    onClick={() => cancelar(a.id)}
                  >✕ Cancelar</button>
                </div>
              )}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
