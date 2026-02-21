import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  services: { name: string; price: number } | null;
}

export function PagarTab({ userId }: { userId: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    supabase
      .from("appointments")
      .select("id, appointment_date, appointment_time, services(name, price)")
      .eq("user_id", userId)
      .then(({ data }) => {
        if (data) setAppointments(data as unknown as Appointment[]);
      });
  }, [userId]);

  const total = appointments.reduce((sum, a) => sum + (a.services?.price || 0), 0);

  return (
    <div className="space-y-6 max-w-2xl">
      <h3 className="text-lg font-semibold">Resumo de consumo</h3>

      {appointments.length === 0 ? (
        <p className="text-muted-foreground">Nenhum agendamento encontrado.</p>
      ) : (
        <>
          <div className="space-y-2">
            {appointments.map((a) => (
              <div key={a.id} className="flex justify-between items-center p-3 bg-card rounded-lg border border-border">
                <div>
                  <p className="font-medium text-foreground">{a.services?.name || "Serviço"}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(a.appointment_date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })} às {a.appointment_time}
                  </p>
                </div>
                <span className="text-primary font-semibold">R$ {Number(a.services?.price || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg border border-primary/30">
            <span className="font-semibold text-foreground">Total</span>
            <span className="text-xl font-bold text-primary">R$ {total.toFixed(2)}</span>
          </div>
        </>
      )}
    </div>
  );
}
