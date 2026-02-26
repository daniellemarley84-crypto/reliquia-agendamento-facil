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
  redD:  "#4a1a1a",
  green: "#50a850",
  text:  "#e8dfc8",
  textM: "#9a8c70",
  textD: "#5a4e38",
  border:"#2a2418",
  DM:    "'DM Sans', sans-serif",
};

interface UserProfile {
  id: string;
  user_id: string;
  nome: string;
  phone: string;
  dataCadastro: string;
  status: string;
}

export default function TabCadastrantes() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, user_id, name, phone, created_at, is_admin")
          .eq("is_admin", false)
          .order("created_at", { ascending: false });

        if (profiles) {
          setUsers(profiles.map(p => {
            const d = new Date(p.created_at);
            return {
              id: p.id,
              user_id: p.user_id,
              nome: p.name || "Sem nome",
              phone: p.phone || "—",
              dataCadastro: d.toLocaleDateString("pt-BR"),
              status: "ativo",
            };
          }));
        }
      } catch (err) {
        console.error("Erro ao carregar cadastrantes:", err);
      }
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const filtered = users.filter(u =>
    u.nome.toLowerCase().includes(search.toLowerCase()) || u.id.includes(search)
  );

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
        {loading && <div style={{ textAlign:"center", padding:"40px 0", color:T.textD, fontSize:12 }}>Carregando...</div>}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign:"center", padding:"40px 0", color:T.textD, fontSize:12, letterSpacing:"0.1em", textTransform:"uppercase" }}>Nenhum cadastrante encontrado</div>
        )}

        {filtered.map(user => {
          const isExpanded = expandedId === user.id;
          const initials = user.nome.split(" ").map(n => n[0]).slice(0, 2).join("");

          return (
            <div key={user.id} style={{
              background: T.bg3,
              border:`1px solid ${isExpanded ? T.gold : T.border}`,
              borderRadius:10, overflow:"hidden",
              boxShadow: isExpanded ? `0 0 0 1px #c9a84c30` : "none",
              transition:"all 0.2s",
            }}>

              {/* Cabeçalho do card */}
              <div
                style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", cursor:"pointer", userSelect:"none" }}
                onClick={() => setExpandedId(isExpanded ? null : user.id)}
              >
                <div style={{
                  width:36, height:36, borderRadius:"50%",
                  background: "linear-gradient(135deg,#2a1a08,#3d2810)",
                  border: `1px solid #5a3a18`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:13, fontWeight:700, color: T.gold, flexShrink:0,
                }}>{initials}</div>

                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color: T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.nome}</div>
                  <div style={{ fontSize:10, color:T.textD, letterSpacing:"0.08em", marginTop:2 }}>ID #{user.id.slice(0, 8)}</div>
                </div>

                <div style={{ width:7, height:7, borderRadius:"50%", flexShrink:0, background: T.green, boxShadow:`0 0 5px ${T.green}80` }} />

                <button
                  style={{ fontSize:10, letterSpacing:"0.06em", textTransform:"uppercase", background:"#1e1a14", border:`1px solid #3a2a14`, color:"#9a7a40", padding:"4px 10px", borderRadius:4, cursor:"pointer", flexShrink:0, fontFamily:T.DM, fontWeight:500 }}
                  onClick={e => { e.stopPropagation(); setExpandedId(isExpanded ? null : user.id); }}
                >{isExpanded ? "▲ Fechar" : "▼ Dados"}</button>
              </div>

              {/* Detalhes expandidos */}
              {isExpanded && (
                <div style={{ borderTop:`1px solid #1e1a14`, padding:"14px 16px", display:"flex", flexDirection:"column", gap:8 }}>
                  {[
                    { l:"Telefone", v: user.phone },
                    { l:"Cadastro", v: user.dataCadastro },
                  ].map(r => (
                    <div key={r.l} style={{ display:"flex", gap:8, fontSize:12 }}>
                      <span style={{ fontSize:10, fontWeight:700, color:T.textD, letterSpacing:"0.06em", textTransform:"uppercase", width:72, flexShrink:0, paddingTop:1 }}>{r.l}</span>
                      <span style={{ color:"#b8a880" }}>{r.v}</span>
                    </div>
                  ))}
                  <div style={{ display:"flex", gap:8, fontSize:12 }}>
                    <span style={{ fontSize:10, fontWeight:700, color:T.textD, letterSpacing:"0.06em", textTransform:"uppercase", width:72, flexShrink:0, paddingTop:1 }}>Status</span>
                    <span style={{ color: T.green, fontWeight:600 }}>● Ativo</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
