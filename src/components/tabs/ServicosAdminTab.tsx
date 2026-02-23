import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface Service {
  id: string;
  name: string;
  price: number;
  duracao_minutos: number | null;
  descricao: string | null;
}

export function ServicosAdminTab() {
  const [services, setServices] = useState<Service[]>([]);
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [duracao, setDuracao] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadServices(); }, []);

  const loadServices = async () => {
    const { data } = await supabase.from("services").select("*").order("created_at", { ascending: false });
    if (data) setServices(data as unknown as Service[]);
  };

  const handleSave = async () => {
    if (!nome.trim() || !valor) { toast.error("Preencha nome e valor"); return; }
    setLoading(true);
    const { error } = await supabase.from("services").insert({
      name: nome.trim(),
      price: parseFloat(valor),
      duracao_minutos: duracao ? parseInt(duracao) : 30,
      descricao: descricao.trim() || null,
    });
    setLoading(false);
    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success("Serviço salvo!");
      setNome(""); setValor(""); setDuracao(""); setDescricao("");
      loadServices();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) toast.error("Erro: " + error.message);
    else { toast.success("Serviço excluído!"); loadServices(); }
  };

  return (
    <div className="space-y-8">
      <div className="bg-card border border-border rounded-xl p-6 space-y-4 max-w-lg">
        <h3 className="text-lg font-semibold">Novo Serviço</h3>
        <Input placeholder="Nome do serviço" value={nome} onChange={(e) => setNome(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input type="number" placeholder="Valor (R$)" value={valor} onChange={(e) => setValor(e.target.value)} />
          <Input type="number" placeholder="Duração (min)" value={duracao} onChange={(e) => setDuracao(e.target.value)} />
        </div>
        <Textarea placeholder="Descrição (opcional)" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} />
        <Button onClick={handleSave} disabled={loading}>{loading ? "Salvando..." : "Salvar Serviço"}</Button>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Serviços Cadastrados</h3>
        {services.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum serviço cadastrado.</p>
        ) : (
          <div className="space-y-2">
            {services.map((s) => (
              <div key={s.id} className="flex justify-between items-center p-4 bg-card rounded-lg border border-border">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-muted-foreground">
                    R$ {Number(s.price).toFixed(2)} • {s.duracao_minutos || 30} min
                    {s.descricao && ` • ${s.descricao}`}
                  </p>
                </div>
                <button onClick={() => handleDelete(s.id)} className="text-destructive hover:text-destructive/80">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
