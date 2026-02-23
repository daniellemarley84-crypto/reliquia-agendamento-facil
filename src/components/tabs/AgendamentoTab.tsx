import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ArrowLeft, Check } from "lucide-react";
import { ComboModal } from "@/components/ComboModal";

const TIME_SLOTS = [
  "09:00", "09:45", "10:30", "11:15", "12:00",
  "15:00", "15:45", "16:30", "17:15", "18:00", "18:45", "19:30", "20:15",
];

interface Service {
  id: string;
  name: string;
  price: number;
  duracao_minutos: number | null;
  descricao: string | null;
}

export function AgendamentoTab({ userId }: { userId: string }) {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCombo, setShowCombo] = useState(false);

  useEffect(() => {
    supabase.from("services").select("*").then(({ data }) => {
      if (data) setServices(data as unknown as Service[]);
    });
  }, []);

  useEffect(() => {
    if (date) {
      const dateStr = date.toISOString().split("T")[0];
      supabase
        .from("appointments")
        .select("appointment_time")
        .eq("appointment_date", dateStr)
        .eq("status", "confirmado")
        .then(({ data }) => {
          setBookedTimes((data || []).map((d: any) => d.appointment_time));
        });
    }
  }, [date]);

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const goToStep = (s: number) => setStep(s);

  const handleConfirm = async (combo = false) => {
    if (!selectedServices.length || !date || !time) return;
    setLoading(true);
    const appointments = selectedServices.map((serviceId) => ({
      user_id: userId,
      service_id: serviceId,
      appointment_date: date.toISOString().split("T")[0],
      appointment_time: time,
      status: "confirmado",
      combo,
    }));
    const { error } = await supabase.from("appointments").insert(appointments);
    setLoading(false);
    if (error) {
      toast.error("Erro ao agendar: " + error.message);
    } else {
      setShowSuccess(true);
    }
  };

  const handlePreConfirm = () => {
    if (selectedServices.length >= 2) {
      setShowCombo(true);
    } else {
      handleConfirm(false);
    }
  };

  const resetFlow = () => {
    setSelectedServices([]);
    setDate(undefined);
    setTime(null);
    setStep(1);
    setShowSuccess(false);
    setShowCombo(false);
  };

  const selectedServiceObjects = services.filter((s) => selectedServices.includes(s.id));
  const availableTimes = TIME_SLOTS.filter((t) => !bookedTimes.includes(t));

  return (
    <div className="space-y-6 max-w-2xl relative">
      {/* Steps indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all", step >= s ? "bg-primary text-primary-foreground border-primary" : "border-border")}>
            {step > s ? <Check className="w-4 h-4" /> : s}
          </div>
        ))}
      </div>

      {/* Step 1: Services */}
      {step === 1 && (
        <div className="animate-fade-in space-y-4">
          <h3 className="text-lg font-semibold">Selecione os serviços</h3>
          {services.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum serviço disponível.</p>
          ) : (
            <div className="space-y-2">
              {services.map((s) => (
                <label key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border cursor-pointer hover:border-primary/50 transition-colors">
                  <Checkbox checked={selectedServices.includes(s.id)} onCheckedChange={() => toggleService(s.id)} />
                  <div className="flex-1">
                    <span className="font-medium">{s.name}</span>
                    {s.descricao && <p className="text-xs text-muted-foreground">{s.descricao}</p>}
                    {s.duracao_minutos && <p className="text-xs text-muted-foreground">{s.duracao_minutos} min</p>}
                  </div>
                  <span className="text-primary font-semibold">R$ {Number(s.price).toFixed(2)}</span>
                </label>
              ))}
            </div>
          )}
          <Button onClick={() => goToStep(2)} disabled={!selectedServices.length}>Próximo</Button>
        </div>
      )}

      {/* Step 2: Calendar */}
      {step === 2 && (
        <div className="animate-fade-in space-y-4">
          <button onClick={() => goToStep(1)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Voltar</button>
          <h3 className="text-lg font-semibold">Escolha a data</h3>
          <div className="bg-card border border-border rounded-lg p-4 inline-block">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => { setDate(d); if (d) goToStep(3); }}
              disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
              className="pointer-events-auto"
            />
          </div>
        </div>
      )}

      {/* Step 3: Time */}
      {step === 3 && (
        <div className="animate-fade-in space-y-4">
          <button onClick={() => goToStep(2)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Voltar</button>
          <h3 className="text-lg font-semibold">Horário disponível</h3>
          {availableTimes.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum horário disponível neste dia.</p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {availableTimes.map((slot) => (
                <button
                  key={slot}
                  onClick={() => { setTime(slot); goToStep(4); }}
                  className={cn(
                    "py-2 px-3 rounded-md text-sm border transition-colors",
                    time === slot
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-foreground hover:border-primary/50"
                  )}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === 4 && (
        <div className="animate-fade-in space-y-4">
          <button onClick={() => goToStep(3)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Voltar</button>
          <h3 className="text-lg font-semibold">Confirmar Agendamento</h3>
          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            <p><span className="text-muted-foreground">Serviços:</span> {selectedServiceObjects.map((s) => s.name).join(", ")}</p>
            <p><span className="text-muted-foreground">Data:</span> {date?.toLocaleDateString("pt-BR")}</p>
            <p><span className="text-muted-foreground">Horário:</span> {time}</p>
            <p><span className="text-muted-foreground">Total:</span> <span className="text-primary font-bold">R$ {selectedServiceObjects.reduce((s, sv) => s + Number(sv.price), 0).toFixed(2)}</span></p>
          </div>
          <Button onClick={handlePreConfirm} disabled={loading} className="w-full sm:w-auto">
            {loading ? "Agendando..." : "✦ Confirmar Agendamento"}
          </Button>
        </div>
      )}

      {/* Combo Modal */}
      {showCombo && (
        <ComboModal
          services={selectedServiceObjects.map((s) => ({ nome: s.name, valor: Number(s.price), icon: "✂️" }))}
          onClose={() => { setShowCombo(false); handleConfirm(false); }}
          onConfirm={() => { setShowCombo(false); handleConfirm(true); }}
        />
      )}

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,.75)", backdropFilter: "blur(4px)", animation: "fadeIn .4s" }}>
          <div className="bg-card border border-border rounded-xl p-8 max-w-md mx-4 text-center space-y-4" style={{ animation: "slideUp .45s cubic-bezier(.16,1,.3,1)" }}>
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Agendamento Confirmado!</h3>
            <p className="text-muted-foreground">Muito obrigado pelo agendamento, estarei esperando por você!</p>
            <Button onClick={resetFlow}>Fazer outro Agendamento</Button>
          </div>
        </div>
      )}
    </div>
  );
}
