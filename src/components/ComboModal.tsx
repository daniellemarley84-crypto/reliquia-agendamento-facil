import { useState } from "react";
import { X } from "lucide-react";

interface ComboService {
  nome: string;
  valor: number;
  icon: string;
}

interface ComboModalProps {
  services: ComboService[];
  onClose: () => void;
  onConfirm: () => void;
}

export function ComboModal({ services, onClose, onConfirm }: ComboModalProps) {
  const [confirmed, setConfirmed] = useState(false);
  const total = services.reduce((s, sv) => s + sv.valor, 0);
  const discount = Math.round(total * 0.2 * 100) / 100;
  const comboPrice = total - discount;

  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(() => {
      onConfirm();
    }, 3000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,.75)", backdropFilter: "blur(4px)", animation: "fadeIn .4s" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-[520px] rounded border overflow-hidden"
        style={{
          background: "hsl(var(--dark2))",
          borderColor: "hsla(43,58%,54%,.35)",
          animation: "slideUp .45s cubic-bezier(.16,1,.3,1)",
        }}
      >
        {/* Gold top bar */}
        <div className="h-[3px]" style={{ background: "linear-gradient(90deg, hsl(var(--gold)), hsl(var(--gold-light)))" }} />

        {/* Decorative star */}
        <div className="absolute top-3 right-4 text-xl" style={{ color: "hsl(var(--gold))" }}>✦</div>

        {/* Close button */}
        <button onClick={onClose} className="absolute top-[18px] left-5 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 pt-10 space-y-5">
          {!confirmed ? (
            <>
              {/* Offer tag */}
              <div className="inline-block px-3 py-1 rounded text-[11px] uppercase tracking-wider font-semibold" style={{ border: "1px solid hsl(var(--gold))", color: "hsl(var(--gold))" }}>
                ★ Oferta exclusiva para você
              </div>

              {/* Heading */}
              <div>
                <h2 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Monte seu <span style={{ color: "hsl(var(--gold))" }}>Combo</span>
                </h2>
                <h2 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>e economize agora</h2>
                <p className="text-sm text-muted-foreground mt-2">Você selecionou serviços que ficam ainda melhores juntos...</p>
              </div>

              {/* Services grid */}
              <div className="grid grid-cols-2 gap-2 combo-grid">
                {services.map((s, i) => (
                  <div key={i} className="p-3 rounded border" style={{ background: "hsl(var(--dark3))", borderColor: "hsla(0,0%,100%,.08)" }}>
                    <span className="text-lg mr-2">{s.icon}</span>
                    <span className="font-medium text-sm">{s.nome}</span>
                    <p className="text-sm text-muted-foreground line-through mt-1">R$ {s.valor.toFixed(2)}</p>
                  </div>
                ))}
              </div>

              {/* Price block */}
              <div className="p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3" style={{ background: "linear-gradient(135deg, hsla(43,58%,54%,.12), hsla(43,72%,66%,.08))", border: "1px solid hsl(var(--gold))" }}>
                <div className="text-sm text-muted-foreground">
                  Separado ficaria <span className="line-through">R$ {total.toFixed(2)}</span>
                </div>
                <div className="text-center sm:text-right">
                  <p className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "hsl(var(--gold))" }}>
                    R$ {comboPrice.toFixed(0)}
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-bold rounded" style={{ background: "hsl(var(--destructive))", color: "#fff" }}>
                    Você economiza R$ {discount.toFixed(0)} 🔥
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <button
                onClick={handleConfirm}
                className="w-full py-3 rounded font-semibold text-sm transition-all hover:brightness-110"
                style={{ background: "linear-gradient(135deg, hsl(var(--gold)), hsl(var(--gold-light)))", color: "hsl(var(--primary-foreground))" }}
              >
                ✦ Quero o Combo com desconto
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded text-sm border transition-colors hover:bg-accent/30"
                style={{ borderColor: "hsla(0,0%,100%,.15)", color: "hsl(var(--muted-foreground))" }}
              >
                Não, prefiro pagar separado
              </button>
            </>
          ) : (
            /* Success state */
            <div className="text-center py-6 space-y-4" style={{ animation: "fadeIn .4s" }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ border: "2px solid hsl(var(--gold))", background: "hsla(43,58%,54%,.15)" }}>
                <span className="text-2xl" style={{ color: "hsl(var(--gold))" }}>✦</span>
              </div>
              <h3 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Combo confirmado!</h3>
              <p className="text-sm text-muted-foreground">
                Você garantiu o Combo Relíquia com desconto de R$ {discount.toFixed(0)}. Nos vemos em breve!
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 420px) {
          .combo-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
