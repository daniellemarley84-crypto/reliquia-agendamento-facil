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
  redD:  "#4a1a1a",
  green: "#50a850",
  text:  "#e8dfc8",
  textM: "#9a8c70",
  textD: "#5a4e38",
  border:"#2a2418",
  DM:    "'DM Sans', sans-serif",
};

const mockUsers = [
  { id:"001", nome:"Carlos Mendes",  email:"carlos@email.com",  telefone:"(85) 99812-3456", dataCadastro:"12/01/2025", status:"ativo",  banReason:"" },
  { id:"002", nome:"Rafael Lima",    email:"rafael@email.com",  telefone:"(85) 98765-4321", dataCadastro:"23/01/2025", status:"ativo",  banReason:"" },
  { id:"003", nome:"Thiago Souza",   email:"thiago@email.com",  telefone:"(85) 99234-5678", dataCadastro:"05/02/2025", status:"banido", banReason:"Você foi banido por falta de comprometimento com o barbeiro!" },
  { id:"004", nome:"Gustavo Rocha",  email:"gus@email.com",     telefone:"(85) 98111-2233", dataCadastro:"18/02/2025", status:"ativo",  banReason:"" },
  { id:"005", nome:"Lucas Ferreira", email:"lucas@email.com",   telefone:"(85) 99987-6543", dataCadastro:"20/02/2025", status:"ativo",  banReason:"" },
];

const BAN_PRESETS = [
  "Você foi banido por falta de comprometimento com o barbeiro!",
  "Você foi banido por não comparecer aos agendamentos sem aviso.",
  "Você foi banido por comportamento inadequado na barbearia.",
  "Você foi banido por cancelamentos excessivos.",
  "Outro motivo (personalizado)",
];

export default function TabCadastrantes() {
  const [search,         setSearch]         = useState("");
  const [users,          setUsers]          = useState(mockUsers);
  const [expandedId,     setExpandedId]     = useState(null);
  const [confirmAction,  setConfirmAction]  = useState(null);
  const [selectedPreset, setSelectedPreset] = useState("");
  const [customReason,   setCustomReason]   = useState("");

  const filtered = users.filter(u =>
    u.nome.toLowerCase().includes(search.toLowerCase()) || u.id.includes(search)
  );

  const openBanModal = (user) => {
    setSelectedPreset("");
    setCustomReason("");
    setConfirmAction({ userId:user.id, type:"ban", isBanned:user.status==="banido", email:user.email, nome:user.nome });
  };

  const handleBan = () => {
    const reason = selectedPreset === "Outro motivo (personalizado)" ? customReason : selectedPreset;
    setUsers(prev => prev.map(u =>
      u.id === confirmAction.userId
        ? { ...u, status: u.status==="banido" ? "ativo" : "banido", banReason: u.status==="banido" ? "" : reason }
        : u
    ));
    setConfirmAction(null);
    setSelectedPreset("");
    setCustomReason("");
  };

  const handleDelete = (id) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    setConfirmAction(null);
    setExpandedId(null);
  };

  const isCustom   = selectedPreset === "Outro motivo (personalizado)";
  const canConfirm = confirmAction?.isBanned || (selectedPreset && (!isCustom || customReason.trim().length > 3));

  return (
    <div style={{ background:T.bg1, minHeight:"100%", fontFamily:T.DM, color:T.text }}>

      {/* Header */}
      <div style={{ background:`linear-gradient(135deg,#1a0a00 0%,${T.bg2} 60%)`, borderBottom:`1px solid #3a2a1a`, padding:"24px 28px 20px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-30, right:-30, width:140, height:140, borderRadius:"50%", background:"radial-gradient(circle,#c8860020 0%,transparent 70%)", pointerEvents:"none" }} />
        <div style={{ fontSize:11, letterSpacing:"0.18em", textTransform:"uppercase", color:T.goldD, fontWeight:700, marginBottom:4 }}>Gestão</div>
        <div style={{ fontSize:18, fontWeight:800, color:T.gold, letterSpacing:"0.04em" }}>Cadastrantes</div>
        <div style={{ fontSize:11, color:T.textD, letterSpacing:"0.12em", textTransform:"uppercase", marginTop:2 }}>Usuários registrados na plataforma</div>
      </div>

      {/* Busca */}
      <div style={{ display:"flex", alignItems:"center", gap:10, background:T.bg2, border:`1px solid ${T.border}`, borderRadius:8, padding:"10px 14px", margin:"20px 24px 14px" }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.textD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          style={{ background:"transparent", border:"none", outline:"none", color:T.text, fontFamily:T.DM, fontSize:13, width:"100%" }}
          placeholder="Buscar por nome ou ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && <span style={{ color:T.textD, cursor:"pointer", fontSize:14 }} onClick={() => setSearch("")}>✕</span>}
      </div>

      <div style={{ margin:"0 24px 14px", fontSize:11, color:T.textD, letterSpacing:"0.1em", textTransform:"uppercase", fontWeight:500 }}>
        {filtered.length} cadastrante{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
      </div>

      {/* Lista */}
      <div style={{ display:"flex", flexDirection:"column", gap:10, padding:"0 24px 32px" }}>
        {filtered.length === 0 && (
          <div style={{ textAlign:"center", padding:"40px 0", color:T.textD, fontSize:12, letterSpacing:"0.1em", textTransform:"uppercase" }}>Nenhum cadastrante encontrado</div>
        )}

        {filtered.map(user => {
          const isExpanded = expandedId === user.id;
          const isBanned   = user.status === "banido";
          const initials   = user.nome.split(" ").map(n => n[0]).slice(0, 2).join("");

          return (
            <div key={user.id} style={{
              background: isBanned ? "#120e0e" : T.bg3,
              border:`1px solid ${isExpanded ? (isBanned ? T.red : T.gold) : (isBanned ? T.redD : T.border)}`,
              borderRadius:10, overflow:"hidden",
              boxShadow: isExpanded ? `0 0 0 1px ${isBanned ? "#c8404030" : "#c9a84c30"}` : "none",
              transition:"all 0.2s",
            }}>

              {/* Banner banido */}
              {isBanned && (
                <div style={{ display:"flex", alignItems:"flex-start", gap:10, background:"linear-gradient(90deg,#2a0808,#1c0606)", borderBottom:`1px solid #5a1a1a`, padding:"10px 16px" }}>
                  <span style={{ fontSize:14, flexShrink:0, marginTop:1 }}>🚫</span>
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:T.red, letterSpacing:"0.05em", textTransform:"uppercase" }}>Conta Banida</div>
                    <div style={{ fontSize:10, color:"#7a3030", marginTop:1 }}>Email banido · {user.email}</div>
                    {user.banReason && <div style={{ fontSize:11, color:"#c86060", fontStyle:"italic", marginTop:4, lineHeight:1.4 }}>"{user.banReason}"</div>}
                  </div>
                </div>
              )}

              {/* Cabeçalho do card */}
              <div
                style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", cursor:"pointer", userSelect:"none" }}
                onClick={() => setExpandedId(isExpanded ? null : user.id)}
              >
                <div style={{
                  width:36, height:36, borderRadius:"50%",
                  background: isBanned ? "linear-gradient(135deg,#2a0a0a,#3d1010)" : "linear-gradient(135deg,#2a1a08,#3d2810)",
                  border:`1px solid ${isBanned ? "#5a1818" : "#5a3a18"}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:13, fontWeight:700, color: isBanned ? T.red : T.gold, flexShrink:0,
                }}>{initials}</div>

                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color: isBanned ? "#8a5a5a" : T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.nome}</div>
                  <div style={{ fontSize:10, color:T.textD, letterSpacing:"0.08em", marginTop:2 }}>ID #{user.id}</div>
                </div>

                <div style={{ width:7, height:7, borderRadius:"50%", flexShrink:0, background: isBanned ? T.red : T.green, boxShadow:`0 0 5px ${isBanned ? T.red : T.green}80` }} />

                <button
                  style={{ fontSize:10, letterSpacing:"0.06em", textTransform:"uppercase", background:"#1e1a14", border:`1px solid #3a2a14`, color:"#9a7a40", padding:"4px 10px", borderRadius:4, cursor:"pointer", flexShrink:0, fontFamily:T.DM, fontWeight:500 }}
                  onClick={e => { e.stopPropagation(); setExpandedId(isExpanded ? null : user.id); }}
                >{isExpanded ? "▲ Fechar" : "▼ Dados"}</button>
              </div>

              {/* Detalhes expandidos */}
              {isExpanded && (
                <div style={{ borderTop:`1px solid #1e1a14`, padding:"14px 16px", display:"flex", flexDirection:"column", gap:8 }}>
                  {[
                    { l:"Email",    v: user.email },
                    { l:"Telefone", v: user.telefone },
                    { l:"Cadastro", v: user.dataCadastro },
                  ].map(r => (
                    <div key={r.l} style={{ display:"flex", gap:8, fontSize:12 }}>
                      <span style={{ fontSize:10, fontWeight:700, color:T.textD, letterSpacing:"0.06em", textTransform:"uppercase", width:72, flexShrink:0, paddingTop:1 }}>{r.l}</span>
                      <span style={{ color:"#b8a880" }}>{r.v}</span>
                    </div>
                  ))}
                  <div style={{ display:"flex", gap:8, fontSize:12 }}>
                    <span style={{ fontSize:10, fontWeight:700, color:T.textD, letterSpacing:"0.06em", textTransform:"uppercase", width:72, flexShrink:0, paddingTop:1 }}>Status</span>
                    <span style={{ color: isBanned ? T.red : T.green, fontWeight:600 }}>{isBanned ? "● Banido" : "● Ativo"}</span>
                  </div>

                  <div style={{ display:"flex", gap:8, marginTop:6, paddingTop:12, borderTop:`1px solid #1a1610` }}>
                    <button
                      style={{ flex:1, fontSize:11, letterSpacing:"0.06em", textTransform:"uppercase", background:"transparent", border:`1px solid ${isBanned ? "#2a5a2a" : "#7a4a1a"}`, color: isBanned ? T.green : "#c87030", padding:"7px 0", borderRadius:4, cursor:"pointer", fontFamily:T.DM, fontWeight:600 }}
                      onClick={() => openBanModal(user)}
                    >{isBanned ? "✓ Desbanir" : "⊘ Banir"}</button>
                    <button
                      style={{ flex:1, fontSize:11, letterSpacing:"0.06em", textTransform:"uppercase", background:"transparent", border:`1px solid #5a1a1a`, color:T.red, padding:"7px 0", borderRadius:4, cursor:"pointer", fontFamily:T.DM, fontWeight:600 }}
                      onClick={() => setConfirmAction({ userId:user.id, type:"delete", nome:user.nome })}
                    >✕ Apagar</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {confirmAction && (
        <div
          style={{ position:"fixed", inset:0, background:"#00000095", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, backdropFilter:"blur(5px)" }}
          onClick={() => setConfirmAction(null)}
        >
          <div
            style={{ background:"#141210", border:`1px solid #3a2a14`, borderRadius:14, padding:"26px 28px", maxWidth:400, width:"94%", boxShadow:"0 24px 60px #000000b0" }}
            onClick={e => e.stopPropagation()}
          >
            {confirmAction.type === "ban" ? (
              confirmAction.isBanned ? (
                <>
                  <div style={{ textAlign:"center", fontSize:28, marginBottom:10 }}>✅</div>
                  <div style={{ fontSize:15, fontWeight:700, color:T.text, textAlign:"center", marginBottom:4 }}>Desbanir usuário?</div>
                  <div style={{ fontSize:11, color:T.textD, textAlign:"center", marginBottom:20, lineHeight:1.5 }}>
                    O email <strong style={{ color:T.gold }}>{confirmAction.email}</strong> voltará a ter acesso completo ao app.
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button style={{ flex:1, fontSize:11, letterSpacing:"0.06em", textTransform:"uppercase", background:"#1e1a14", border:`1px solid #3a2a14`, color:T.textD, padding:"9px 0", borderRadius:5, cursor:"pointer", fontFamily:T.DM, fontWeight:500 }} onClick={() => setConfirmAction(null)}>Cancelar</button>
                    <button style={{ flex:1, fontSize:11, letterSpacing:"0.06em", textTransform:"uppercase", background:"#2a1800", border:`1px solid ${T.gold}`, color:T.gold, padding:"9px 0", borderRadius:5, cursor:"pointer", fontFamily:T.DM, fontWeight:600 }} onClick={handleBan}>Desbanir</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ textAlign:"center", fontSize:28, marginBottom:10 }}>🚫</div>
                  <div style={{ fontSize:15, fontWeight:700, color:T.text, textAlign:"center", marginBottom:4 }}>Banir {confirmAction.nome}?</div>
                  <div style={{ fontSize:11, color:T.textD, textAlign:"center", marginBottom:16, lineHeight:1.5 }}>Selecione ou escreva o motivo exibido para o usuário.</div>

                  <div style={{ fontSize:10, fontWeight:700, color:T.textD, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>Motivo do banimento</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:14 }}>
                    {BAN_PRESETS.map(p => (
                      <button key={p}
                        style={{ display:"flex", alignItems:"flex-start", gap:9, background: selectedPreset===p ? "#2a1a08" : "#1a1610", border:`1px solid ${selectedPreset===p ? T.gold : "#2e2418"}`, borderRadius:6, padding:"9px 12px", cursor:"pointer", textAlign:"left", width:"100%", boxShadow: selectedPreset===p ? `0 0 0 1px #c9a84c30` : "none" }}
                        onClick={() => { setSelectedPreset(p); setCustomReason(""); }}
                      >
                        <div style={{ width:14, height:14, borderRadius:"50%", border:`2px solid ${selectedPreset===p ? T.gold : "#4a3a1a"}`, background: selectedPreset===p ? T.gold : "transparent", flexShrink:0, marginTop:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
                          {selectedPreset===p && <div style={{ width:5, height:5, borderRadius:"50%", background:"#141210" }} />}
                        </div>
                        <span style={{ fontSize:12, color: selectedPreset===p ? "#e0c880" : "#9a8060", lineHeight:1.45, fontFamily:T.DM }}>{p}</span>
                      </button>
                    ))}
                  </div>

                  {isCustom && (
                    <textarea
                      style={{ width:"100%", background:"#1a1610", border:`1px solid #3a2a14`, borderRadius:6, padding:"10px 12px", color:T.text, fontFamily:T.DM, fontSize:12, resize:"none", outline:"none", minHeight:72, marginBottom:14, lineHeight:1.5 }}
                      placeholder="Escreva o motivo do banimento..."
                      value={customReason}
                      onChange={e => setCustomReason(e.target.value)}
                      maxLength={180}
                      autoFocus
                    />
                  )}

                  <div style={{ display:"flex", gap:8 }}>
                    <button style={{ flex:1, fontSize:11, letterSpacing:"0.06em", textTransform:"uppercase", background:"#1e1a14", border:`1px solid #3a2a14`, color:T.textD, padding:"9px 0", borderRadius:5, cursor:"pointer", fontFamily:T.DM, fontWeight:500 }} onClick={() => setConfirmAction(null)}>Cancelar</button>
                    <button
                      disabled={!canConfirm}
                      style={{ flex:1, fontSize:11, letterSpacing:"0.06em", textTransform:"uppercase", background:"#2a1800", border:`1px solid ${T.gold}`, color:T.gold, padding:"9px 0", borderRadius:5, cursor: canConfirm ? "pointer" : "not-allowed", fontFamily:T.DM, fontWeight:600, opacity: canConfirm ? 1 : 0.35 }}
                      onClick={handleBan}
                    >Confirmar ban</button>
                  </div>
                </>
              )
            ) : (
              <>
                <div style={{ textAlign:"center", fontSize:28, marginBottom:10 }}>🗑️</div>
                <div style={{ fontSize:15, fontWeight:700, color:T.text, textAlign:"center", marginBottom:4 }}>Apagar cadastro?</div>
                <div style={{ fontSize:11, color:T.textD, textAlign:"center", marginBottom:20, lineHeight:1.5 }}>
                  Esta ação é irreversível. O cadastro de <strong style={{ color:T.gold }}>{confirmAction.nome}</strong> será permanentemente removido.
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button style={{ flex:1, fontSize:11, letterSpacing:"0.06em", textTransform:"uppercase", background:"#1e1a14", border:`1px solid #3a2a14`, color:T.textD, padding:"9px 0", borderRadius:5, cursor:"pointer", fontFamily:T.DM, fontWeight:500 }} onClick={() => setConfirmAction(null)}>Cancelar</button>
                  <button style={{ flex:1, fontSize:11, letterSpacing:"0.06em", textTransform:"uppercase", background:"#2a0808", border:`1px solid ${T.red}`, color:T.red, padding:"9px 0", borderRadius:5, cursor:"pointer", fontFamily:T.DM, fontWeight:600 }} onClick={() => handleDelete(confirmAction.userId)}>Apagar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
