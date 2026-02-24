import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SLIDES = [
  { id: 1, title: "Qualidade Premium", desc: "A melhor experiência para você." },
  { id: 2, title: "Sabor Inigualável", desc: "Ingredientes selecionados." },
  { id: 3, title: "Ofertas Especiais", desc: "Confira nossos combos." },
];

const COMBOS = [
  { id: 1, name: "Combo Casal", price: "R$ 89,90", featured: false },
  { id: 2, name: "Relíquia Especial", price: "R$ 110,00", featured: true },
  { id: 3, name: "Combo Família", price: "R$ 150,00", featured: false },
];

const Index = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* HERO SLIDER */}
      <section className="relative h-[70vh] overflow-hidden">
        {SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${
              index === currentSlide
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-full"
            }`}
          >
            <div className="relative z-10 text-center px-6">
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
                {slide.title}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                {slide.desc}
              </p>
              <button
                onClick={() => navigate("/login")}
                className="px-8 py-3 rounded-md bg-primary text-primary-foreground font-semibold text-lg hover:opacity-90 transition-opacity"
              >
                Agendar Agora
              </button>
            </div>
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </div>
        ))}

        {/* Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-3 h-3 rounded-full transition-all ${
                i === currentSlide ? "bg-primary scale-125" : "bg-muted-foreground/40"
              }`}
            />
          ))}
        </div>
      </section>

      {/* COMBOS */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-2">Nossos Combos</h2>
          <div className="w-16 h-1 bg-primary mx-auto rounded-full" />
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {COMBOS.map((combo) => (
            <div
              key={combo.id}
              className={`rounded-lg border bg-card p-6 flex flex-col items-center text-center transition-transform hover:scale-105 ${
                combo.featured
                  ? "border-primary shadow-[0_0_0_0_hsl(var(--primary)/0.4)] animate-[pulseGold_2s_infinite]"
                  : "border-border"
              }`}
              style={
                combo.featured
                  ? {
                      animation: "pulseGold 2s infinite",
                    }
                  : undefined
              }
            >
              <div className="w-full h-40 rounded-md bg-muted flex items-center justify-center mb-4">
                <span className="text-muted-foreground text-sm">
                  Imagem {combo.name}
                </span>
              </div>
              <h3 className="text-xl font-bold mb-1">{combo.name}</h3>
              <span className="text-primary font-bold text-lg mb-4">
                {combo.price}
              </span>
              <button
                onClick={() => navigate("/login")}
                className="w-full py-2.5 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
              >
                Agendar
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
