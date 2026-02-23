import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, DollarSign, Scissors, Store } from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Appointment {
  appointment_date: string;
  services: { name: string; price: number } | null;
}

export function GanhosTab() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const baseDate = weekOffset === 0 ? new Date() : (weekOffset > 0 ? addWeeks(new Date(), weekOffset) : subWeeks(new Date(), Math.abs(weekOffset)));
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(baseDate, { weekStartsOn: 1 });

  useEffect(() => {
    setLoading(true);
    const ws = format(weekStart, "yyyy-MM-dd");
    const we = format(weekEnd, "yyyy-MM-dd");
    supabase
      .from("appointments")
      .select("appointment_date, services(name, price)")
      .gte("appointment_date", ws)
      .lte("appointment_date", we)
      .eq("status", "confirmado")
      .then(({ data }) => {
        setAppointments((data as unknown as Appointment[]) || []);
        setLoading(false);
      });
  }, [weekOffset]);

  const totalRevenue = appointments.reduce((s, a) => s + (a.services?.price || 0), 0);
  const barberShare = totalRevenue * 0.6;
  const shopShare = totalRevenue * 0.4;

  const periodLabel = `${format(weekStart, "dd/MM", { locale: ptBR })} – ${format(weekEnd, "dd/MM/yyyy", { locale: ptBR })}`;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => setWeekOffset((o) => o - 1)}><ChevronLeft className="w-4 h-4" /></Button>
        <h3 className="text-lg font-semibold">{periodLabel}</h3>
        <Button variant="outline" size="icon" onClick={() => setWeekOffset((o) => o + 1)}><ChevronRight className="w-4 h-4" /></Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">💰 Total faturado</p>
              <p className="text-xl font-bold">R$ {totalRevenue.toFixed(2)}</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Scissors className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">✂️ Barbeiro (60%)</p>
              <p className="text-xl font-bold">R$ {barberShare.toFixed(2)}</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">🏪 Barbearia (40%)</p>
              <p className="text-xl font-bold">R$ {shopShare.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
