import { MessageCircle, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SuporteTab() {
  return (
    <div className="space-y-4 max-w-md">
      <h3 className="text-lg font-semibold mb-4">Entre em contato</h3>

      <a href="https://wa.me/+5585997410934" target="_blank" rel="noopener noreferrer">
        <Button variant="outline" className="w-full justify-start gap-3 h-14 bg-card border-border">
          <MessageCircle className="w-5 h-5 text-green-500" />
          <div className="text-left">
            <p className="font-medium text-foreground">WhatsApp</p>
            <p className="text-xs text-muted-foreground">(85) 99741-0934</p>
          </div>
        </Button>
      </a>

      <a href="https://instagram.com/reliquiabarber_" target="_blank" rel="noopener noreferrer">
        <Button variant="outline" className="w-full justify-start gap-3 h-14 bg-card border-border mt-4">
          <Instagram className="w-5 h-5 text-pink-500" />
          <div className="text-left">
            <p className="font-medium text-foreground">Instagram</p>
            <p className="text-xs text-muted-foreground">@reliquiabarber_</p>
          </div>
        </Button>
      </a>
    </div>
  );
}
