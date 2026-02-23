import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  payload += formatField("00", "01");
  payload += merchantAccount;
  payload += formatField("52", "0000");
  payload += formatField("53", "986");
  if (amount > 0) payload += formatField("54", amount.toFixed(2));
  payload += formatField("58", "BR");
  payload += formatField("59", name.substring(0, 25));
  payload += formatField("60", city.substring(0, 15));
  payload += formatField("62", formatField("05", "***"));
  payload += "6304";
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

interface ClientSummary {
  user_id: string;
  name: string;
  total: number;
}

export function PagarAdminTab() {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [selected, setSelected] = useState<ClientSummary | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    const { data: appts } = await supabase
      .from("appointments")
      .select("user_id, services(price)")
      .eq("status", "confirmado");

    if (!appts) return;

    const map = new Map<string, number>();
    (appts as any[]).forEach((a) => {
      const uid = a.user_id;
      map.set(uid, (map.get(uid) || 0) + (a.services?.price || 0));
    });

    const userIds = [...map.keys()];
    if (userIds.length === 0) return;

    const { data: profiles } = await supabase.from("profiles").select("user_id, name").in("user_id", userIds);
    const nameMap = new Map((profiles || []).map((p: any) => [p.user_id, p.name]));

    const result: ClientSummary[] = userIds.map((uid) => ({
      user_id: uid,
      name: nameMap.get(uid) || "Cliente",
      total: map.get(uid) || 0,
    })).filter((c) => c.total > 0);

    setClients(result);
  };

  const pixPayload = selected ? generatePixPayload("+5585997410934", "Harley Deyson Girao", "Caucaia", selected.total) : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(pixPayload);
    setCopied(true);
    toast.success("Código PIX copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h3 className="text-lg font-semibold">Gerar PIX para Cliente</h3>

      {clients.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum agendamento confirmado.</p>
      ) : (
        <div className="space-y-2">
          {clients.map((c) => (
            <button
              key={c.user_id}
              onClick={() => setSelected(c)}
              className={`w-full flex justify-between items-center p-4 rounded-lg border transition-colors text-left ${
                selected?.user_id === c.user_id ? "bg-primary/10 border-primary" : "bg-card border-border hover:border-primary/50"
              }`}
            >
              <span className="font-medium">{c.name}</span>
              <span className="text-primary font-semibold">R$ {c.total.toFixed(2)}</span>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center space-y-4">
          <p className="text-sm text-muted-foreground">QR Code PIX para <strong>{selected.name}</strong></p>
          <div className="bg-white p-4 rounded-lg">
            <QRCodeSVG value={pixPayload} size={200} />
          </div>
          <div className="w-full">
            <p className="text-xs text-muted-foreground mb-2 text-center">Código copia-e-cola:</p>
            <div className="flex gap-2">
              <code className="flex-1 text-xs bg-background border border-border rounded p-2 break-all max-h-20 overflow-auto">{pixPayload}</code>
              <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
