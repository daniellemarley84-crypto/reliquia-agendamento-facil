import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  services: { name: string; price: number } | null;
}

// PIX EMV payload generator
function generatePixPayload(key: string, name: string, city: string, amount: number): string {
  const formatField = (id: string, value: string) => {
    const len = value.length.toString().padStart(2, "0");
    return `${id}${len}${value}`;
  };

  const gui = formatField("00", "br.gov.bcb.pix");
  const chave = formatField("01", key);
  const merchantAccount = formatField("26", gui + chave);

  let payload = "";
  payload += formatField("00", "01"); // Payload Format
  payload += merchantAccount;
  payload += formatField("52", "0000"); // MCC
  payload += formatField("53", "986"); // Currency BRL
  if (amount > 0) payload += formatField("54", amount.toFixed(2));
  payload += formatField("58", "BR"); // Country
  payload += formatField("59", name.substring(0, 25)); // Merchant Name
  payload += formatField("60", city.substring(0, 15)); // City
  payload += formatField("62", formatField("05", "***")); // Additional data

  // CRC16 placeholder
  payload += "6304";

  // Calculate CRC16 CCITT
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
      else crc <<= 1;
      crc &= 0xFFFF;
    }
  }
  return payload + crc.toString(16).toUpperCase().padStart(4, "0");
}

export function PagarTab({ userId }: { userId: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase
      .from("appointments")
      .select("id, appointment_date, appointment_time, services(name, price)")
      .eq("user_id", userId)
      .eq("status", "confirmado")
      .then(({ data }) => {
        if (data) setAppointments(data as unknown as Appointment[]);
      });
  }, [userId]);

  const total = appointments.reduce((sum, a) => sum + (a.services?.price || 0), 0);
  const pixPayload = total > 0 ? generatePixPayload("+5585997410934", "Harley Deyson Girao", "Caucaia", total) : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(pixPayload);
    setCopied(true);
    toast.success("Código PIX copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h3 className="text-lg font-semibold">Pagamento via PIX</h3>

      {appointments.length === 0 ? (
        <p className="text-muted-foreground">Nenhum agendamento confirmado para pagar.</p>
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

          {total > 0 && (
            <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center space-y-4">
              <p className="text-sm text-muted-foreground">Escaneie o QR Code para pagar</p>
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG value={pixPayload} size={200} />
              </div>
              <div className="w-full">
                <p className="text-xs text-muted-foreground mb-2 text-center">Ou copie o código PIX:</p>
                <div className="flex gap-2">
                  <code className="flex-1 text-xs bg-background border border-border rounded p-2 break-all max-h-20 overflow-auto">
                    {pixPayload}
                  </code>
                  <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
