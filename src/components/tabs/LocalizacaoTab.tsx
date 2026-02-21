import { MapPin } from "lucide-react";

export function LocalizacaoTab() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start gap-3 p-4 bg-card rounded-lg border border-border">
        <MapPin className="w-5 h-5 text-primary mt-0.5" />
        <div>
          <h3 className="font-semibold text-foreground">Endereço</h3>
          <p className="text-muted-foreground">Caucaia, Jurema, Rua Idealista 886</p>
        </div>
      </div>

      <div className="rounded-lg overflow-hidden border border-border">
        <iframe
          title="Localização Relíquia Barber"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3981.0!2d-38.65!3d-3.74!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM8KwNDQnMjQuMCJTIDM4wrAzOScwMC4wIlc!5e0!3m2!1spt-BR!2sbr!4v1600000000000"
          width="100%"
          height="400"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}
