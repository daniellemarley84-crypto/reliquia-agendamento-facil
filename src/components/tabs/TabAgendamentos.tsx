import { useState } from "react";

if (!document.querySelector('link[href*="DM+Sans"]')) {
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap";
  document.head.appendChild(l);
}

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

const mockAgendamentos = [
  { id:"A001", cliente:"Carlos Mendes",  servico:"Corte e Barba",      data:"25/02/2025", hora:"09:00", valor:"R$35", status:"confirmado" },
  { id:"A002", cliente:"Rafael Lima",    servico:"Corte",               data:"25/02/2025", hora:"09:45", valor:"R$20", status:"confirmado" },
  { id:"A003", cliente:"Gustavo Rocha",  servico:"Luzes e Corte",       data:"25/02/2025", hora:"10:30", valor:"R$60", status:"pendente"   },
  { id:"A004", cliente:"Lucas Ferreira", servico:"Corte e Sobrancelha", data:"26/02/2025", hora:"09:00", valor:"R$25", status:"confirmado" },
  { id:"A005", cliente:"Carlos Mendes",  servico:"Barba",               data:"26/02/2025", hora:"10:30", valor:"R$20", status:"pendente"   },
];

const statusColor = (s) => s === "confirmado" ? T.green : T.gold;

const FILTROS = ["todos", "confirmado", "pendente"];

export default function TabAgendamentos() {
  const [agendamentos, setAgendamentos] = useState(mockAgendamentos);
  const [filtro,       setFiltro]       = useState("todos");

  const visible = agendamentos.filter(a => filtro === "todos" || a.status === filtro);

  const cancelar  = (id) => setAgendamentos(prev => prev.filter(a => a.id !== id));
  const confirmar = (id) => setAgendamentos(prev => prev.map(a => a.id === id ? { ...a, status:"confirmado" } : a));

  const totalFiltro = visible.length;
  const totalValor  = visible
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
        {visible.length === 0 && (
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
