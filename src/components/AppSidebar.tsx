import { Calendar, MapPin, MessageCircle, CreditCard, LogOut, User, Home } from "lucide-react";
import logo from "@/assets/logo.png";
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
  { id: "inicio", title: "Início", icon: Home },
  { id: "perfil", title: "Perfil", icon: User },
  { id: "agendamentos", title: "Agendar", icon: Calendar },
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
        <img src={logo} alt="Relíquia Barber" className="w-20 h-20 object-contain" />
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
