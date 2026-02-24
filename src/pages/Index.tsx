import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* HERO SLIDER */}
      <section className="relative h-[70vh] min-h-[400px] overflow-hidden">
        {SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            className="absolute inset-0 flex items-center justify-center transition-opacity duration-700"
            style={{ opacity: currentSlide === index ? 1 : 0, pointerEvents: currentSlide === index ? "auto" : "none" }}
          >
            <div className="relative z-10 text-center px-6 animate-fade-in">
              <h1
                className="text-4xl md:text-6xl font-bold mb-4"
                style={{ fontFamily: "'Playfair Display', serif", color: "hsl(var(--gold))" }}
              >
                {slide.title}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto">
                {slide.desc}
              </p>
              <Button
                onClick={() => navigate("/login")}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-3 rounded-md"
              >
                Ver Cardápio
              </Button>
            </div>
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-background/80" />
          </div>
        ))}

        {/* Slide indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className="w-3 h-3 rounded-full transition-all duration-300"
              style={{
                background: currentSlide === i ? "hsl(var(--gold))" : "hsl(var(--muted))",
                transform: currentSlide === i ? "scale(1.3)" : "scale(1)",
              }}
            />
          ))}
        </div>
      </section>

      {/* COMBOS */}
      <section className="py-16 px-4" style={{ background: "hsl(var(--dark2))" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl md:text-4xl font-bold mb-2"
              style={{ fontFamily: "'Playfair Display', serif", color: "hsl(var(--gold))" }}
            >
              Nossos Combos
            </h2>
            <div className="w-20 h-0.5 mx-auto" style={{ background: "hsl(var(--gold))" }} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {COMBOS.map((combo) => (
              <Card
                key={combo.id}
                className={`overflow-hidden border transition-transform duration-300 hover:scale-105 ${
                  combo.featured ? "ring-2" : ""
                }`}
                style={{
                  background: "hsl(var(--dark3))",
                  borderColor: combo.featured
                    ? "hsl(var(--gold))"
                    : "hsl(var(--border))",
                  boxShadow: combo.featured
                    ? "0 0 0 0 rgba(201,168,76,0.4)"
                    : undefined,
                  animation: combo.featured ? "pulseGold 2s infinite" : undefined,
                }}
              >
                {/* Placeholder image area */}
                <div
                  className="h-40 flex items-center justify-center text-muted-foreground text-sm"
                  style={{ background: "hsl(var(--muted))" }}
                >
                  Imagem {combo.name}
                </div>
                <div className="p-5 text-center">
                  <h3
                    className="text-xl font-bold mb-1"
                    style={{ fontFamily: "'Playfair Display', serif", color: "hsl(var(--cream))" }}
                  >
                    {combo.name}
                  </h3>
                  <span
                    className="text-lg font-bold block mb-4"
                    style={{ color: "hsl(var(--gold-light))" }}
                  >
                    {combo.price}
                  </span>
                  <Button
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => navigate("/login")}
                  >
                    Adicionar ao Pedido
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
