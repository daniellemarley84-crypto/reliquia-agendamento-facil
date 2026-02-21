import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TIME_SLOTS = [
  "09:00", "09:45", "10:30", "11:15", "12:00",
  "15:00", "15:45", "16:30", "17:15", "18:00", "18:45", "19:30", "20:15",
];

interface Service {
  id: string;
  name: string;
  price: number;
}

export function AgendamentoTab({ userId }: { userId: string }) {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("services").select("*").then(({ data }) => {
      if (data) setServices(data);
    });
  }, []);

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleAgendar = async () => {
    if (!selectedServices.length || !date || !time) {
      toast.error("Selecione serviço(s), data e horário");
      return;
    }

    setLoading(true);
    const appointments = selectedServices.map((serviceId) => ({
      user_id: userId,
      service_id: serviceId,
      appointment_date: date.toISOString().split("T")[0],
      appointment_time: time,
    }));

    const { error } = await supabase.from("appointments").insert(appointments);
    setLoading(false);

    if (error) {
      toast.error("Erro ao agendar: " + error.message);
    } else {
      toast.success("Agendamento realizado com sucesso!");
      setSelectedServices([]);
      setTime(null);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Serviços */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Selecione os serviços</h3>
        {services.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum serviço cadastrado ainda.</p>
        ) : (
          <div className="space-y-2">
            {services.map((s) => (
              <label key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border cursor-pointer hover:border-primary/50 transition-colors">
                <Checkbox
                  checked={selectedServices.includes(s.id)}
                  onCheckedChange={() => toggleService(s.id)}
                />
                <span className="flex-1">{s.name}</span>
                <span className="text-primary font-medium">R$ {Number(s.price).toFixed(2)}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Calendário */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Escolha a data</h3>
        <div className="bg-card border border-border rounded-lg p-4 inline-block">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
            className="pointer-events-auto"
          />
        </div>
      </div>

      {/* Horários */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Horário disponível</h3>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {TIME_SLOTS.map((slot) => (
            <button
              key={slot}
              onClick={() => setTime(slot)}
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
      </div>

      <Button onClick={handleAgendar} disabled={loading} className="w-full sm:w-auto">
        {loading ? "Agendando..." : "Agendar"}
      </Button>
    </div>
  );
}
