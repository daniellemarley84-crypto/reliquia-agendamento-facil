import { useState, useEffect, useRef } from "react";

if (!document.querySelector('link[href*="DM+Sans"]')) {
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap";
  document.head.appendChild(l);
}

// ─── Dados ───────────────────────────────────────────────────────────────────
const SLIDES = [
  { id: 1, src: "/photos/foto1.jpg", alt: "Foto 1" },
  { id: 2, src: "/photos/foto2.jpg", alt: "Foto 2" },
  { id: 3, src: "/photos/foto3.jpg", alt: "Foto 3" },
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

// ════════════════════════════════════════════════════════════════════════════
//  CONTEÚDO DA ABA INÍCIO (sem header, sem nav)
// ════════════════════════════════════════════════════════════════════════════
export default function TabInicio({ onNavigate }) {
  const [current, setCurrent] = useState(0);
  const [drag,    setDrag]    = useState(false);
  const [hover,   setHover]   = useState(false);
  const startX = useRef(0);
  const timer  = useRef(null);
  const total  = SLIDES.length;

  const next = () => setCurrent(c => (c + 1) % total);
  const prev = () => setCurrent(c => (c - 1 + total) % total);
  const resetTimer = () => { clearInterval(timer.current); timer.current = setInterval(next, 2000); };
  useEffect(() => { resetTimer(); return () => clearInterval(timer.current); }, []);

  const onDown = e => { startX.current = e.clientX ?? e.touches?.[0]?.clientX; setDrag(true); };
  const onUp   = e => {
    if (!drag) return;
    const dx = startX.current - (e.clientX ?? e.changedTouches?.[0]?.clientX);
    if (Math.abs(dx) > 40) { dx > 0 ? next() : prev(); resetTimer(); }
    setDrag(false);
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "28px 16px 32px", gap: 20,
      background: C.black, minHeight: "100%", fontFamily: C.DM
    }}>
      {/* Logo / Título */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10, width:"100%" }}>
        <div style={{ width:48, height:1, background:C.white }} />
        <h1 style={{
          fontFamily: C.DM, color: C.white, fontSize: 12, fontWeight: 400,
          letterSpacing: "0.22em", textTransform: "uppercase",
          textAlign: "center", margin: 0, lineHeight: 1.8
        }}>
          BEM-VINDO A<br/>
          <span style={{ fontFamily:C.DM, fontSize:22, fontWeight:800, letterSpacing:"0.08em" }}>
            RELÍQUIA BARBER
          </span>
        </h1>
        <div style={{ width:48, height:1, background:C.white }} />
      </div>

      {/* Carrossel */}
      <div
        style={{
          position: "relative", width: "100%", maxWidth: 320,
          aspectRatio: "4/3", borderRadius: 12, overflow: "hidden",
          boxShadow: "0 4px 28px rgba(0,0,0,0.85), 0 0 0 1px #2a2a2a",
          cursor: "grab", userSelect: "none", background: "#111"
        }}
        onMouseDown={onDown} onMouseUp={onUp}
        onTouchStart={onDown} onTouchEnd={onUp}
      >
        <div style={{
          display: "flex", width: "100%", height: "100%",
          transition: "transform 0.55s cubic-bezier(0.65,0,0.35,1)",
          transform: `translateX(-${current * 100}%)`
        }}>
          {SLIDES.map(s => (
            <div key={s.id} style={{
              minWidth: "100%", height: "100%", position: "relative",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "#111"
            }}>
              <img
                src={s.src} alt={s.alt} draggable={false}
                style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
                onError={e => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.parentElement.style.background = "#1a1a1a";
                }}
              />
              <span style={{ position:"absolute", color:"#333", fontSize:11, fontFamily:C.DM, pointerEvents:"none" }}>
                {s.alt}
              </span>
            </div>
          ))}
        </div>

        {/* Setas */}
        {([["‹", { left: 10 } as React.CSSProperties, prev], ["›", { right: 10 } as React.CSSProperties, next]] as [string, React.CSSProperties, () => void][]).map(([ch, pos, fn]) => (
          <button key={ch} style={{
            position: "absolute", top: "50%", transform: "translateY(-50%)", ...pos,
            background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)",
            color: C.white, borderRadius: 6, width: 28, height: 32,
            fontSize: 22, fontWeight: 300, fontFamily: C.DM,
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", padding: 0, zIndex: 10
          }}
            onClick={() => { fn(); resetTimer(); }}
          >{ch}</button>
        ))}
      </div>

      {/* Dots */}
      <div style={{ display:"flex", gap:8 }}>
        {SLIDES.map((_, i) => (
          <button key={i} style={{
            width: 7, height: 7, borderRadius: "50%", border: "none", padding: 0,
            cursor: "pointer", transition: "all 0.3s",
            background: i === current ? C.white : "#444",
            transform: i === current ? "scale(1.3)" : "scale(1)"
          }}
            onClick={() => { setCurrent(i); resetTimer(); }}
          />
        ))}
      </div>

      {/* Botão Agendar */}
      <button
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          width: "100%", maxWidth: 320, padding: "14px 0",
          background: hover ? "#e0e0e0" : C.white, color: C.black,
          border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700,
          letterSpacing: "0.18em", textTransform: "uppercase",
          fontFamily: C.DM, cursor: "pointer", transition: "all 0.2s",
          transform: hover ? "translateY(-1px)" : "none",
          boxShadow: hover ? "0 6px 20px rgba(255,255,255,0.12)" : "0 2px 10px rgba(255,255,255,0.06)"
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => onNavigate("agendar")}
      >
        <span style={{ fontSize:15 }}>✂</span> AGENDAR AGORA
      </button>

      <p style={{ fontFamily:C.DM, color:"#444", fontSize:10, letterSpacing:"0.15em", textTransform:"uppercase", margin:0 }}>
        Deslize para explorar
      </p>
    </div>
  );
}
