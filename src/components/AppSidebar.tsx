import { Calendar, MapPin, MessageCircle, CreditCard, LogOut, Scissors } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const menuItems = [
  { id: "agendamentos", title: "Agendamentos", icon: Calendar },
  { id: "localizacao", title: "Localização", icon: MapPin },
  { id: "suporte", title: "Suporte", icon: MessageCircle },
  { id: "pagar", title: "Pagar", icon: CreditCard },
];

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

export function AppSidebar({ activeTab, onTabChange, onLogout }: AppSidebarProps) {
  return (
    <Sidebar className="border-r border-border">
      <div className="p-6 flex flex-col items-center border-b border-border">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <Scissors className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-lg font-bold tracking-wider uppercase text-foreground">Relíquia</h1>
        <span className="text-xs text-muted-foreground tracking-widest uppercase">Barber</span>
      </div>

      <SidebarContent className="flex flex-col justify-between flex-1">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.id)}
                    className={activeTab === item.id ? "bg-sidebar-accent text-primary font-medium" : ""}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto pb-4">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onLogout} className="text-destructive hover:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
