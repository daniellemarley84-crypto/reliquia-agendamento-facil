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

const mockUsers = [
  { id:"001", status:"ativo"  },
  { id:"002", status:"ativo"  },
  { id:"003", status:"banido" },
  { id:"004", status:"ativo"  },
  { id:"005", status:"ativo"  },
];

const mockAgendamentos = [
  { id:"A001", cliente:"Carlos Mendes",  servico:"Corte e Barba",      data:"25/02/2025", hora:"09:00", valor:"R$35", status:"confirmado" },
  { id:"A002", cliente:"Rafael Lima",    servico:"Corte",               data:"25/02/2025", hora:"09:45", valor:"R$20", status:"confirmado" },
  { id:"A003", cliente:"Gustavo Rocha",  servico:"Luzes e Corte",       data:"25/02/2025", hora:"10:30", valor:"R$60", status:"pendente"   },
  { id:"A004", cliente:"Lucas Ferreira", servico:"Corte e Sobrancelha", data:"26/02/2025", hora:"09:00", valor:"R$25", status:"confirmado" },
  { id:"A005", cliente:"Carlos Mendes",  servico:"Barba",               data:"26/02/2025", hora:"10:30", valor:"R$20", status:"cancelado"  },
];

const statusColor = (s) => s === "confirmado" ? T.green : s === "cancelado" ? T.red : T.gold;

export default function TabDashboard() {
  const banidos        = mockUsers.filter(u => u.status === "banido").length;
  const ativos         = mockUsers.length - banidos;
  const hoje           = mockAgendamentos.filter(a => a.data === "25/02/2025");
  const faturamentoDia = hoje.reduce((s, a) => s + parseInt(a.valor.replace("R$", "")), 0);

  const stats = [
    { label:"Clientes Ativos",   value: ativos,              icon:"👤", color: T.green  },
    { label:"Contas Banidas",    value: banidos,              icon:"🚫", color: T.red    },
    { label:"Agenda Hoje",       value: hoje.length,          icon:"📅", color: T.gold   },
    { label:"Faturamento / Dia", value:`R$${faturamentoDia}`, icon:"💰", color: T.goldL  },
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
          {hoje.map(a => (
            <div key={a.id} style={{ background:T.bg3, border:`1px solid ${T.border}`, borderRadius:10, padding:"12px 14px", display:"flex", alignItems:"center", gap:12 }}>
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

      </div>
    </div>
  );
}
