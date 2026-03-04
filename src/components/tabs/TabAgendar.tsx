import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

if (!document.querySelector('link[href*="DM+Sans"]')) {
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap";
  document.head.appendChild(l);
}

if (!document.querySelector("#reliquia-agendar-styles")) {
  const style = document.createElement("style");
  style.id = "reliquia-agendar-styles";
  style.textContent = `
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }
    @keyframes slideInLeft {
      from { transform: translateX(-100%); opacity: 0; }
      to   { transform: translateX(0);     opacity: 1; }
    }
    .slide-enter-forward  { animation: slideInRight 1s cubic-bezier(0.4,0,0.2,1) forwards; }
    .slide-enter-backward { animation: slideInLeft  1s cubic-bezier(0.4,0,0.2,1) forwards; }

    @keyframes comboPop {
      0%   { transform: scale(0.92) translateY(8px); opacity: 0; }
      60%  { transform: scale(1.03) translateY(-2px); opacity: 1; }
      100% { transform: scale(1)    translateY(0);    opacity: 1; }
    }
    .combo-pop { animation: comboPop 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards; }

    @keyframes pulseGold {
      0%, 100% { box-shadow: 0 0 0 0 rgba(201,168,76,0.5); }
      50%       { box-shadow: 0 0 0 6px rgba(201,168,76,0); }
    }
    .pulse-gold { animation: pulseGold 1.6s ease-in-out infinite; }
  `;
  document.head.appendChild(style);
}

// ─── Dados ───────────────────────────────────────────────────────────────────
const PRECOS = {
  corte: 20, barba: 20, pezinho: 10, bigode: 5,
  sobrancelha: 10, luzes: 45, pigmentacao: 10, pos: 10,
};

const SERVICOS = {
  alinhamentos: [
    { id: "corte",       name: "Corte",       price: "R$20" },
    { id: "barba",       name: "Barba",       price: "R$20" },
    { id: "pezinho",     name: "Pezinho",     price: "R$10" },
    { id: "bigode",      name: "Bigode",      price: "R$5"  },
    { id: "sobrancelha", name: "Sobrancelha", price: "R$10" },
  ],
  quimicas: [
    { id: "luzes",       name: "Luzes",       price: "R$45" },
    { id: "pigmentacao", name: "Pigmentação", price: "R$10" },
    { id: "pos",         name: "Pós Química", price: "R$10" },
  ],
};

const COMBOS = [
  { id: "combo1", name: "Combo 1", label: "Corte e Barba",              price: 35, servicos: ["corte","barba"] },
  { id: "combo2", name: "Combo 2", label: "Corte, Barba e Sobrancelha", price: 40, servicos: ["corte","barba","sobrancelha"] },
  { id: "combo3", name: "Combo 3", label: "Corte e Sobrancelha",        price: 25, servicos: ["corte","sobrancelha"] },
  { id: "combo4", name: "Combo 4", label: "Luzes e Corte",              price: 60, servicos: ["luzes","corte"] },
];

const CATS = [
  { key: "all",          label: "Todos",        icon: ""   },
  { key: "alinhamentos", label: "Alinhamentos", icon: "📏" },
  { key: "quimicas",     label: "Químicas",     icon: "🖌️" },
  { key: "combos",       label: "Combos",       icon: "🏷️" },
];

const C = {
  bg:    "#0d0c0a",
  bg2:   "#141210",
  bg3:   "#1c1a16",
  bg4:   "#242018",
  gold:  "#c9a84c",
  goldL: "#f0d080",
  goldD: "#7a5f25",
  text:  "#e8dfc8",
  textD: "#8a7f6a",
  white: "#ffffff",
  black: "#000000",
  DM:    "'DM Sans', sans-serif",
};

const allServicos = [...SERVICOS.alinhamentos, ...SERVICOS.quimicas];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function detectarCombo(selecionados) {
  if (selecionados.length < 2) return null;
  const ids = new Set(selecionados);
  return [...COMBOS]
    .sort((a, b) => b.servicos.length - a.servicos.length)
    .find(c => c.servicos.every(s => ids.has(s))) ?? null;
}

function calcularPrecoTotal(selecionados, combo) {
  if (!combo) return selecionados.reduce((s, id) => s + (PRECOS[id] ?? 0), 0);
  const extras = selecionados.filter(id => !combo.servicos.includes(id));
  return combo.price + extras.reduce((s, id) => s + (PRECOS[id] ?? 0), 0);
}

function calcularPrecoSemCombo(combo) {
  return combo.servicos.reduce((s, id) => s + (PRECOS[id] ?? 0), 0);
}

// ════════════════════════════════════════════════════════════════════════════
//  BANNER COMBO
// ════════════════════════════════════════════════════════════════════════════
function ComboBanner({ combo, onAceitar }) {
  const precoSemCombo = calcularPrecoSemCombo(combo);
  const economia = precoSemCombo - combo.price;

  return (
    <div className="combo-pop" style={{ margin:"0 18px 16px", background:"linear-gradient(135deg,#1e1a10 0%,#2a2010 100%)", border:`1.5px solid ${C.gold}`, borderRadius:14, padding:"14px 16px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:-20, right:-20, width:80, height:80, background:"radial-gradient(circle,rgba(201,168,76,0.18) 0%,transparent 70%)", pointerEvents:"none" }} />

      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
        <span style={{ fontSize:16 }}>💡</span>
        <span style={{ fontFamily:C.DM, fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:C.gold }}>Sugestão de Combo</span>
      </div>

      <div style={{ fontFamily:C.DM, fontSize:14, fontWeight:600, color:C.text, marginBottom:10 }}>
        {combo.name} — {combo.label}
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
        <span style={{ fontFamily:C.DM, fontSize:14, color:C.textD, textDecoration:"line-through", textDecorationColor:"#c0392b", textDecorationThickness:2 }}>
          R${precoSemCombo},00
        </span>
        <span style={{ fontSize:12, color:"#c0392b", fontFamily:C.DM, fontWeight:700 }}>▼</span>
        <span style={{ fontFamily:C.DM, fontSize:26, fontWeight:800, color:C.goldL, letterSpacing:-0.5 }}>
          R${combo.price},00
        </span>
        {economia > 0 && (
          <span style={{ fontFamily:C.DM, fontSize:11, fontWeight:700, color:"#4caf50", background:"rgba(76,175,80,0.12)", border:"1px solid rgba(76,175,80,0.3)", borderRadius:20, padding:"3px 9px" }}>
            -R${economia} economia
          </span>
        )}
      </div>

      <button
        className="pulse-gold"
        style={{ width:"100%", padding:"11px 0", background:C.gold, border:"none", borderRadius:10, fontFamily:C.DM, fontSize:13, fontWeight:700, letterSpacing:2, color:C.bg, cursor:"pointer", textTransform:"uppercase" }}
        onClick={onAceitar}
      >
        ✓ Aproveitar Combo
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  ETAPA 1 — Seleção de serviços
// ════════════════════════════════════════════════════════════════════════════
function StepServico({ selecionados, onToggle, onNext, onAceitarCombo, animClass }) {
  const [cat, setCat] = useState("all");
  const visible = key => cat === "all" || cat === key || (cat === "combos" && key === "combos");

  const combo      = detectarCombo(selecionados);
  const precoTotal = calcularPrecoTotal(selecionados, combo);

  return (
    <div className={animClass} style={{ width:"100%", willChange:"transform,opacity" }}>
      <div style={{ background:C.bg, minHeight:"100%", fontFamily:C.DM, color:C.text }}>

        <div style={{ padding:"20px 18px 2px", fontSize:13, fontWeight:700, letterSpacing:2, color:C.goldD, textTransform:"uppercase" }}>
          Escolha os Serviços
        </div>
        <div style={{ padding:"4px 18px 14px", fontSize:11, color:C.textD }}>
          Selecione um ou mais serviços
        </div>

        {/* Filtros */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", padding:"0 18px", marginBottom:16 }}>
          {CATS.map(c => (
            <button key={c.key}
              style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 14px", borderRadius:999, fontSize:12, fontWeight:600, cursor:"pointer", border:`1.5px solid ${cat===c.key?C.gold:"#2e2b24"}`, background:cat===c.key?C.gold:C.bg4, color:cat===c.key?C.bg:C.textD, fontFamily:C.DM, transition:"all 0.18s" }}
              onClick={() => setCat(c.key)}
            >
              {c.icon && <span style={{ fontSize:13 }}>{c.icon}</span>}
              {c.label}
            </button>
          ))}
        </div>

        <div style={{ height:1, background:"linear-gradient(to right,transparent,#2e2b24,transparent)", margin:"0 18px 16px" }} />

        {/* Banner combo */}
        {combo && (
          <ComboBanner combo={combo} onAceitar={() => onAceitarCombo(combo, selecionados)} />
        )}

        {/* Grid */}
        <div style={{ padding:"0 18px" }}>

          {/* Alinhamentos + Químicas */}
          {Object.entries(SERVICOS).map(([key, items]) => {
            if (!visible(key)) return null;
            const icons  = { alinhamentos:"📏", quimicas:"🖌️" };
            const labels = { alinhamentos:"Alinhamentos", quimicas:"Químicas" };
            return (
              <div key={key} style={{ marginBottom:20 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:10, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:C.gold, marginBottom:10 }}>
                  <span>{icons[key]}</span> {labels[key]}
                  <div style={{ flex:1, height:1, background:`linear-gradient(to right,${C.goldD},transparent)` }} />
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {items.map(s => {
                    const sel     = selecionados.includes(s.id);
                    const noCombo = combo && combo.servicos.includes(s.id);
                    return (
                      <button key={s.id}
                        style={{ background:sel?"rgba(201,168,76,0.12)":C.bg4, border:`1.5px solid ${sel?C.gold:noCombo?"rgba(201,168,76,0.4)":"#2e2b24"}`, borderRadius:10, padding:"12px 14px", textAlign:"left", cursor:"pointer", color:sel?C.goldL:C.text, fontFamily:C.DM, fontSize:13, fontWeight:500, lineHeight:1.3, position:"relative", boxShadow:sel?"0 0 14px rgba(201,168,76,0.15)":"none", transition:"all 0.18s" }}
                        onClick={() => onToggle(s.id)}
                      >
                        {s.name}
                        <div style={{ fontSize:11, color:sel?C.goldD:"#555", marginTop:3, fontWeight:400 }}>{s.price}</div>
                        {sel && (
                          <div style={{ position:"absolute", top:7, right:9, width:16, height:16, borderRadius:"50%", background:C.gold, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:C.bg, fontWeight:900 }}>✓</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Combos */}
          {(cat === "all" || cat === "combos") && (
            <div style={{ marginBottom:20 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:10, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:C.gold, marginBottom:10 }}>
                <span>🏷️</span> Combos
                <div style={{ flex:1, height:1, background:`linear-gradient(to right,${C.goldD},transparent)` }} />
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {COMBOS.map(cb => {
                  const precoOriginal = calcularPrecoSemCombo(cb);
                  const economia      = precoOriginal - cb.price;
                  const pct           = Math.round((economia / precoOriginal) * 100);
                  // combo está ativo se todos os serviços dele estão selecionados E comboAtivo bate
                  const ativo = cb.servicos.every(id => selecionados.includes(id)) && combo?.id === cb.id;

                  const handleComboClick = () => {
                    onAceitarCombo(cb, selecionados);
                  };

                  return (
                    <button
                      key={cb.id}
                      style={{
                        background: ativo ? "rgba(201,168,76,0.13)" : "linear-gradient(135deg,#1a1810 0%,#221f14 100%)",
                        border: `1.5px solid ${ativo ? C.gold : "#3a3420"}`,
                        borderRadius: 12,
                        padding: "13px 14px",
                        textAlign: "left",
                        cursor: "pointer",
                        fontFamily: C.DM,
                        position: "relative",
                        boxShadow: ativo ? `0 0 18px rgba(201,168,76,0.18)` : "none",
                        transition: "all 0.18s",
                        overflow: "hidden",
                      }}
                      onClick={handleComboClick}
                    >
                      {/* Badge % desconto */}
                      <div style={{
                        position: "absolute", top: 10, right: 12,
                        background: ativo ? C.gold : "#2a2410",
                        border: `1px solid ${ativo ? C.goldD : "#4a3e18"}`,
                        borderRadius: 20,
                        padding: "2px 8px",
                        fontSize: 10, fontWeight: 800,
                        color: ativo ? C.bg : C.gold,
                        letterSpacing: 0.5,
                      }}>
                        -{pct}%
                      </div>

                      {/* Nome + label */}
                      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6 }}>
                        <span style={{ fontSize:15 }}>🏷️</span>
                        <div>
                          <div style={{ fontSize:13, fontWeight:700, color: ativo ? C.goldL : C.text, lineHeight:1.2 }}>
                            {cb.name}
                          </div>
                          <div style={{ fontSize:11, color:C.textD, marginTop:1 }}>{cb.label}</div>
                        </div>
                      </div>

                      {/* Preços */}
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4 }}>
                        <span style={{ fontSize:12, color:"#666", textDecoration:"line-through", textDecorationColor:"#c0392b", textDecorationThickness:1.5 }}>
                          R${precoOriginal},00
                        </span>
                        <span style={{ fontSize:18, fontWeight:800, color: ativo ? C.goldL : C.gold }}>
                          R${cb.price},00
                        </span>
                        <span style={{ fontSize:11, color:"#4caf50", fontWeight:700 }}>
                          economize R${economia}
                        </span>
                      </div>

                      {/* Check ativo */}
                      {ativo && (
                        <div style={{ position:"absolute", bottom:10, right:12, width:18, height:18, borderRadius:"50%", background:C.gold, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:C.bg, fontWeight:900 }}>✓</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Rodapé */}
        <div style={{ padding:"8px 18px 32px" }}>
          <div style={{ fontFamily:C.DM, background:C.bg3, border:`1px solid ${selecionados.length>0?C.goldD:"#2e2b24"}`, borderRadius:10, padding:"12px 14px", fontSize:13, color:selecionados.length>0?C.text:C.textD, marginBottom:12, minHeight:42, transition:"all 0.2s" }}>
            {selecionados.length === 0
              ? "Nenhum serviço selecionado"
              : <>
                  <span style={{ color:C.gold, fontWeight:600 }}>
                    {selecionados.map(id => allServicos.find(s=>s.id===id)?.name).filter(Boolean).join(", ")}
                  </span>
                  {" — "}
                  <span style={{ color:combo?"#4caf50":C.text, fontWeight:700 }}>
                    R${precoTotal},00{combo ? " (combo)" : ""}
                  </span>
                </>
            }
          </div>
          <button
            disabled={selecionados.length === 0}
            style={{ width:"100%", padding:14, background:selecionados.length>0?C.gold:C.bg4, border:selecionados.length>0?"none":"1px solid #2e2b24", borderRadius:12, fontFamily:C.DM, fontSize:14, fontWeight:700, letterSpacing:2, color:selecionados.length>0?C.bg:C.textD, cursor:selecionados.length>0?"pointer":"not-allowed", textTransform:"uppercase", transition:"all 0.18s" }}
            onClick={onNext}
          >
            Continuar →
          </button>
        </div>

      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  HELPERS DE DATA
// ════════════════════════════════════════════════════════════════════════════
const DIAS_SEMANA = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

// Horários disponíveis (simulados — bloqueados aleatoriamente mas fixos por seed)
// Gera horários de 09:00 às 20:15 com intervalos de 45 min, excluindo 12:00–14:45 (almoço)
const HORARIOS = (() => {
  const slots = [];
  let h = 9, m = 0;
  while (h < 20 || (h === 20 && m <= 15)) {
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    const slot = `${hh}:${mm}`;
    // bloqueia almoço: 12:00 até 14:45 inclusive
    const totalMin = h * 60 + m;
    if (totalMin < 12 * 60 || totalMin >= 15 * 60) slots.push(slot);
    m += 45;
    if (m >= 60) { h += Math.floor(m / 60); m = m % 60; }
  }
  return slots;
})();

// Horários bloqueados são calculados dinamicamente por data selecionada

function getDiasDoMes(ano, mes) {
  const primeiroDia = new Date(ano, mes, 1).getDay();
  const totalDias   = new Date(ano, mes + 1, 0).getDate();
  return { primeiroDia, totalDias };
}

// ════════════════════════════════════════════════════════════════════════════
//  CALENDÁRIO
// ════════════════════════════════════════════════════════════════════════════
function Calendario({ dataSelecionada, onSelect }) {
  const hoje = new Date();
  const [viewAno, setViewAno]   = useState(hoje.getFullYear());
  const [viewMes, setViewMes]   = useState(hoje.getMonth());

  const { primeiroDia, totalDias } = getDiasDoMes(viewAno, viewMes);

  const prevMes = () => {
    if (viewMes === 0) { setViewMes(11); setViewAno(a => a - 1); }
    else setViewMes(m => m - 1);
  };
  const nextMes = () => {
    if (viewMes === 11) { setViewMes(0); setViewAno(a => a + 1); }
    else setViewMes(m => m + 1);
  };

  const isPassado = (dia) => {
    const d = new Date(viewAno, viewMes, dia);
    d.setHours(0,0,0,0);
    const h = new Date(); h.setHours(0,0,0,0);
    return d < h;
  };
  const isDomingo = (dia) => new Date(viewAno, viewMes, dia).getDay() === 0;
  const isSelecionado = (dia) => {
    if (!dataSelecionada) return false;
    return dataSelecionada.dia === dia && dataSelecionada.mes === viewMes && dataSelecionada.ano === viewAno;
  };
  const isHoje = (dia) => dia === hoje.getDate() && viewMes === hoje.getMonth() && viewAno === hoje.getFullYear();

  const cells = [];
  for (let i = 0; i < primeiroDia; i++) cells.push(null);
  for (let d = 1; d <= totalDias; d++) cells.push(d);

  return (
    <div style={{ background:C.bg3, border:`1px solid #2e2b24`, borderRadius:12, padding:"14px 12px", marginBottom:16 }}>
      {/* Header mês */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <button onClick={prevMes} style={{ background:"none", border:"none", color:C.textD, cursor:"pointer", fontSize:18, padding:"0 6px", fontFamily:C.DM }}>‹</button>
        <span style={{ fontFamily:C.DM, fontSize:13, fontWeight:700, color:C.text, letterSpacing:1 }}>
          {MESES[viewMes]} {viewAno}
        </span>
        <button onClick={nextMes} style={{ background:"none", border:"none", color:C.textD, cursor:"pointer", fontSize:18, padding:"0 6px", fontFamily:C.DM }}>›</button>
      </div>

      {/* Labels dias da semana */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:6 }}>
        {DIAS_SEMANA.map(d => (
          <div key={d} style={{ textAlign:"center", fontSize:9, fontWeight:700, color:d==="Dom"?"#6b3030":C.textD, fontFamily:C.DM, letterSpacing:0.5, padding:"2px 0" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid dias */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>
        {cells.map((dia, i) => {
          if (!dia) return <div key={`e${i}`} />;
          const passado  = isPassado(dia);
          const domingo  = isDomingo(dia);
          const sel      = isSelecionado(dia);
          const hoje_    = isHoje(dia);
          const disabled = passado || domingo;
          return (
            <button
              key={dia}
              disabled={disabled}
              onClick={() => !disabled && onSelect({ dia, mes: viewMes, ano: viewAno })}
              style={{
                aspectRatio: "1",
                borderRadius: 8,
                border: sel ? `1.5px solid ${C.gold}` : hoje_ ? `1.5px solid ${C.goldD}` : "1.5px solid transparent",
                background: sel ? C.gold : hoje_ ? "rgba(201,168,76,0.1)" : "transparent",
                color: disabled ? "#333" : sel ? C.bg : domingo ? "#6b3030" : C.text,
                fontSize: 12,
                fontWeight: sel ? 800 : 500,
                fontFamily: C.DM,
                cursor: disabled ? "not-allowed" : "pointer",
                transition: "all 0.15s",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {dia}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  SELETOR DE HORÁRIOS
// ════════════════════════════════════════════════════════════════════════════
function SeletorHorario({
  horarioSelecionado,
  onSelect,
  occupiedTimes,
  loading,
}: {
  horarioSelecionado: string | null;
  onSelect: (value: string) => void;
  occupiedTimes: Set<string>;
  loading: boolean;
}) {
  return (
    <div style={{ background:C.bg3, border:"1px solid #2e2b24", borderRadius:12, padding:"14px 12px", marginBottom:16 }}>
      <div style={{ fontSize:11, color:C.textD, letterSpacing:2, textTransform:"uppercase", marginBottom:12, fontFamily:C.DM }}>
        🕐 Horário
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:7 }}>
        {HORARIOS.map(h => {
          const bloq = occupiedTimes.has(h);
          const sel  = horarioSelecionado === h;
          return (
            <button
              key={h}
              disabled={bloq || loading}
              onClick={() => !bloq && !loading && onSelect(h)}
              style={{
                padding: "8px 4px",
                borderRadius: 8,
                border: sel ? `1.5px solid ${C.gold}` : bloq ? "1.5px solid #1e1c18" : "1.5px solid #2e2b24",
                background: sel ? C.gold : bloq ? "#111" : C.bg4,
                color: bloq ? "#2e2b24" : sel ? C.bg : C.text,
                fontSize: 12,
                fontWeight: sel ? 700 : 500,
                fontFamily: C.DM,
                cursor: bloq || loading ? "not-allowed" : "pointer",
                textDecoration: bloq ? "line-through" : "none",
                transition: "all 0.15s",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {h}
            </button>
          );
        })}
      </div>
      <div style={{ display:"flex", gap:12, marginTop:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <div style={{ width:8, height:8, borderRadius:2, background:C.gold }} />
          <span style={{ fontSize:10, color:C.textD, fontFamily:C.DM }}>Disponível</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <div style={{ width:8, height:8, borderRadius:2, background:"#1e1c18" }} />
          <span style={{ fontSize:10, color:C.textD, fontFamily:C.DM }}>Ocupado</span>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  ETAPA 2 — Confirmação
// ════════════════════════════════════════════════════════════════════════════
function StepConfirmar({ selecionados, comboAtivo, onBack, animClass }) {
  const [hover, setHover] = useState(false);
  const [data, setData] = useState<{ dia: number; mes: number; ano: number } | null>(null);
  const [horario, setHorario] = useState<string | null>(null);
  const [confirmado, setConfirmado] = useState(false);
  const [occupiedTimes, setOccupiedTimes] = useState<Set<string>>(new Set());
  const [loadingTimes, setLoadingTimes] = useState(false);

  const combo = comboAtivo ?? detectarCombo(selecionados);
  const servicosExtras = combo ? selecionados.filter(id => !combo.servicos.includes(id)) : selecionados;
  const extraTotal = servicosExtras.reduce((s, id) => s + (PRECOS[id] ?? 0), 0);
  const precoFinal = combo ? combo.price + extraTotal : selecionados.reduce((s, id) => s + (PRECOS[id] ?? 0), 0);
  const precoSemCombo = combo ? calcularPrecoSemCombo(combo) : 0;
  const pronto = data && horario;

  const dateStr = data
    ? `${data.ano}-${String(data.mes + 1).padStart(2, "0")}-${String(data.dia).padStart(2, "0")}`
    : null;

  useEffect(() => {
    const loadOccupiedTimes = async () => {
      if (!dateStr) {
        setOccupiedTimes(new Set());
        return;
      }

      setLoadingTimes(true);
      const { data: existing, error } = await supabase
        .from("appointments")
        .select("appointment_time")
        .eq("appointment_date", dateStr)
        .eq("status", "confirmado");

      if (!error && existing) {
        setOccupiedTimes(new Set(existing.map((row) => row.appointment_time)));
      }
      setLoadingTimes(false);
    };

    loadOccupiedTimes();
  }, [dateStr]);

  useEffect(() => {
    if (horario && occupiedTimes.has(horario)) {
      setHorario(null);
    }
  }, [occupiedTimes, horario]);

  const dataFormatada = data
    ? `${String(data.dia).padStart(2,"0")}/${String(data.mes+1).padStart(2,"0")}/${data.ano}`
    : null;

  if (confirmado) {
    return (
      <div className={animClass} style={{ width:"100%", willChange:"transform,opacity" }}>
        <div style={{ background:C.bg, minHeight:"60vh", fontFamily:C.DM, color:C.text, padding:"48px 24px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
          <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(76,175,80,0.15)", border:"2px solid #4caf50", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>✓</div>
          <div style={{ fontSize:18, fontWeight:800, color:C.goldL, textAlign:"center", letterSpacing:1 }}>Agendamento Confirmado!</div>
          <div style={{ background:C.bg3, border:`1px solid ${C.goldD}`, borderRadius:12, padding:"16px 20px", width:"100%", textAlign:"center" }}>
            <div style={{ fontSize:12, color:C.textD, marginBottom:6 }}>📅 {dataFormatada} às {horario}</div>
            <div style={{ fontSize:13, color:C.gold, fontWeight:700 }}>
              {combo ? `${combo.name} — ${combo.label}` : selecionados.map(id => allServicos.find(s=>s.id===id)?.name).filter(Boolean).join(", ")}
            </div>
            <div style={{ fontSize:22, fontWeight:800, color:C.goldL, marginTop:8 }}>R${precoFinal},00</div>
          </div>
          <p style={{ fontSize:11, color:C.textD, textAlign:"center", letterSpacing:1 }}>Até logo! ✂️</p>
        </div>
      </div>
    );
  }

  return (
    <div className={animClass} style={{ width:"100%", willChange:"transform,opacity" }}>
      <div style={{ background:C.bg, minHeight:"100%", fontFamily:C.DM, color:C.text, padding:"20px 18px 40px" }}>

        <button
          style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", color:C.textD, fontFamily:C.DM, fontSize:12, fontWeight:600, letterSpacing:1, textTransform:"uppercase", cursor:"pointer", padding:0, marginBottom:20 }}
          onClick={onBack}
        >← Voltar</button>

        <div style={{ fontSize:13, fontWeight:700, letterSpacing:2, color:C.goldD, textTransform:"uppercase", marginBottom:18 }}>
          Confirmar Agendamento
        </div>

        {/* Card resumo serviços */}
        <div style={{ background:C.bg3, border:`1px solid ${C.goldD}`, borderRadius:14, padding:"16px", marginBottom:16 }}>
          <div style={{ fontSize:11, color:C.textD, letterSpacing:2, textTransform:"uppercase", marginBottom:10 }}>Serviços</div>

          {combo ? (
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                <span style={{ fontSize:18 }}>🎯</span>
                <div>
                  <div style={{ fontSize:15, fontWeight:700, color:C.goldL }}>{combo.name}</div>
                  <div style={{ fontSize:12, color:C.textD }}>{combo.label}</div>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10, paddingBottom:10, borderBottom: servicosExtras.length > 0 ? "1px solid #2e2b24" : "none" }}>
                <span style={{ fontSize:14, color:C.textD, textDecoration:"line-through", textDecorationColor:"#c0392b", textDecorationThickness:2 }}>R${precoSemCombo},00</span>
                <span style={{ fontSize:22, fontWeight:800, color:C.goldL }}>R${combo.price},00</span>
                {precoSemCombo > combo.price && (
                  <span style={{ fontSize:11, fontWeight:700, color:"#4caf50", background:"rgba(76,175,80,0.12)", border:"1px solid rgba(76,175,80,0.3)", borderRadius:20, padding:"2px 8px" }}>
                    -R${precoSemCombo - combo.price}
                  </span>
                )}
              </div>
              {servicosExtras.length > 0 && (
                <div style={{ marginTop:10 }}>
                  <div style={{ fontSize:10, color:C.textD, letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>Adicionais</div>
                  {servicosExtras.map(id => {
                    const s = allServicos.find(x => x.id === id);
                    return s ? (
                      <div key={id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom:8, marginBottom:8, borderBottom:"1px solid #2e2b24" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ width:6, height:6, borderRadius:"50%", background:C.gold }} />
                          <span style={{ fontSize:14, fontWeight:600 }}>{s.name}</span>
                        </div>
                        <span style={{ fontSize:14, color:C.gold, fontWeight:700 }}>{s.price}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:10, borderTop:"1px solid #2e2b24", marginTop: servicosExtras.length > 0 ? 0 : 10 }}>
                <span style={{ fontSize:12, color:C.textD, fontWeight:600, letterSpacing:1 }}>TOTAL</span>
                <span style={{ fontSize:26, fontWeight:800, color:C.goldL }}>R${precoFinal},00</span>
              </div>
            </div>
          ) : (
            <div>
              {selecionados.map(id => {
                const s = allServicos.find(x => x.id === id);
                return s ? (
                  <div key={id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom:8, marginBottom:8, borderBottom:"1px solid #2e2b24" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:6, height:6, borderRadius:"50%", background:C.gold }} />
                      <span style={{ fontSize:14, fontWeight:600 }}>{s.name}</span>
                    </div>
                    <span style={{ fontSize:14, color:C.gold, fontWeight:700 }}>{s.price}</span>
                  </div>
                ) : null;
              })}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:4 }}>
                <span style={{ fontSize:12, color:C.textD, fontWeight:600, letterSpacing:1 }}>TOTAL</span>
                <span style={{ fontSize:22, fontWeight:800, color:C.goldL }}>R${precoFinal},00</span>
              </div>
            </div>
          )}
        </div>

        {/* Label seção data */}
        <div style={{ fontSize:11, color:C.textD, letterSpacing:2, textTransform:"uppercase", marginBottom:10, fontFamily:C.DM }}>
          📅 Data
        </div>

        {/* Calendário */}
        <Calendario dataSelecionada={data} onSelect={setData} />

        {/* Horários — só mostra se data escolhida */}
        {data && (
          <SeletorHorario
            horarioSelecionado={horario}
            onSelect={setHorario}
            occupiedTimes={occupiedTimes}
            loading={loadingTimes}
          />
        )}

        {/* Resumo seleção */}
        {pronto && (
          <div style={{ background:"rgba(201,168,76,0.07)", border:`1px solid ${C.goldD}`, borderRadius:10, padding:"10px 14px", marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:14 }}>📅</span>
            <span style={{ fontFamily:C.DM, fontSize:13, color:C.goldL, fontWeight:600 }}>
              {dataFormatada} às {horario}
            </span>
          </div>
        )}

        <button
          disabled={!pronto}
          style={{ width:"100%", padding:14, background:pronto?(hover?C.goldL:C.gold):C.bg4, border:pronto?"none":"1px solid #2e2b24", borderRadius:12, fontFamily:C.DM, fontSize:14, fontWeight:700, letterSpacing:2, color:pronto?C.bg:C.textD, cursor:pronto?"pointer":"not-allowed", textTransform:"uppercase", transition:"all 0.2s", marginTop:8, transform:pronto&&hover?"translateY(-1px)":"none", boxShadow:pronto&&hover?`0 6px 24px rgba(201,168,76,0.3)`:"none" }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onClick={async () => {
            if (!pronto || !dateStr || !horario) return;

            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (!session) { alert("Você precisa estar logado."); return; }

              // Bloqueia novo agendamento da mesma pessoa na mesma data
              const { data: ownAppointment, error: ownError } = await supabase
                .from("appointments")
                .select("id")
                .eq("user_id", session.user.id)
                .eq("appointment_date", dateStr)
                .eq("status", "confirmado")
                .limit(1)
                .maybeSingle();

              if (ownError) {
                alert("Erro ao validar agendamentos existentes.");
                return;
              }

              if (ownAppointment) {
                alert("Você já possui um agendamento confirmado nesta data.");
                return;
              }

              if (occupiedTimes.has(horario)) {
                alert("Esse horário já está ocupado. Escolha outro horário.");
                return;
              }

              const { data: dbServices } = await supabase.from("services").select("id, name").limit(100);
              let serviceId = dbServices?.[0]?.id;

              if (dbServices) {
                const match = dbServices.find(s =>
                  selecionados.some(sel =>
                    s.name.toLowerCase().includes(allServicos.find(x => x.id === sel)?.name?.toLowerCase() || "")
                  )
                );
                if (match) serviceId = match.id;
              }

              if (!serviceId) { alert("Nenhum serviço cadastrado no sistema."); return; }

              const { error } = await supabase.from("appointments").insert({
                user_id: session.user.id,
                service_id: serviceId,
                appointment_date: dateStr,
                appointment_time: horario,
                combo: !!combo,
                status: "confirmado",
              });

              if (error) {
                if ((error as any).code === "23505") {
                  alert("Esse horário já foi reservado. Escolha outro horário.");
                } else {
                  alert("Erro ao agendar: " + error.message);
                }
                return;
              }

              setConfirmado(true);
            } catch (err: any) {
              alert("Erro: " + err.message);
            }
          }}
        >
          {pronto ? "Confirmar Agendamento ✓" : "Escolha data e horário"}
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  EXPORT DEFAULT — TabAgendar
// ════════════════════════════════════════════════════════════════════════════
export default function TabAgendar() {
  const [step,         setStep]         = useState(0);
  const [selecionados, setSelecionados] = useState([]);
  const [comboAtivo,   setComboAtivo]   = useState(null);
  const [animClass,    setAnimClass]    = useState("slide-enter-forward");
  const [rendering,    setRendering]    = useState(true);

  const goTo = (nextStep) => {
    setAnimClass(nextStep > step ? "slide-enter-forward" : "slide-enter-backward");
    setStep(nextStep);
    setRendering(r => !r);
  };

  const toggle = (id) => {
    setSelecionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    setComboAtivo(null);
  };

  const aceitarCombo = (combo, selecionadosAtuais) => {
    const novos = Array.from(new Set([...selecionadosAtuais, ...combo.servicos]));
    setSelecionados(novos);
    setComboAtivo(combo);
    goTo(1);
  };

  const handleBack = () => {
    setComboAtivo(null);
    goTo(0);
  };

  return (
    <div style={{ background:C.bg, minHeight:"100%", overflow:"hidden" }}>

      {/* Progress bar */}
      <div style={{ display:"flex", alignItems:"center", padding:"16px 18px 0", gap:6 }}>
        {[0, 1].map(i => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:i===step?24:7, height:7, borderRadius:999, background:i<step?C.goldD:i===step?C.gold:"#2e2b24", transition:"all 0.4s cubic-bezier(0.4,0,0.2,1)" }} />
            {i < 1 && <div style={{ width:16, height:1, background:"#2e2b24" }} />}
          </div>
        ))}
        <div style={{ marginLeft:"auto", fontFamily:C.DM, fontSize:10, color:C.textD, letterSpacing:1 }}>{step+1} / 2</div>
      </div>

      <div style={{ position:"relative", overflow:"hidden" }}>
        {step === 0 ? (
          <StepServico
            key={`step0-${rendering}`}
            selecionados={selecionados}
            onToggle={toggle}
            onNext={() => selecionados.length > 0 && goTo(1)}
            onAceitarCombo={aceitarCombo}
            animClass={animClass}
          />
        ) : (
          <StepConfirmar
            key={`step1-${rendering}`}
            selecionados={selecionados}
            comboAtivo={comboAtivo}
            onBack={handleBack}
            animClass={animClass}
          />
        )}
      </div>

    </div>
  );
}
