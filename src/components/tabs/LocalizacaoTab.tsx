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
          src="https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=Rua+Idealista+886,+Jurema,+Caucaia,+CE,+Brasil&zoom=16"
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
