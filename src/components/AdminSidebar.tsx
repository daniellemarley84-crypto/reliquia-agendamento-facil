import { LayoutDashboard, LogOut, Scissors, DollarSign, CalendarDays, Users, Image } from "lucide-react";
import logo from "@/assets/logo.png";
import { CarouselPanel } from "@/components/admin/CarouselManager";
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
  { id: "dashboard", title: "Dashboard", icon: LayoutDashboard },
  { id: "agendamentos", title: "Agendamentos", icon: CalendarDays },
  { id: "cadastrantes", title: "Cadastros", icon: Users },
  { id: "servicos", title: "Serviços", icon: Scissors },
  { id: "ganhos", title: "Ganhos", icon: DollarSign },
  { id: "carousel", title: "Carrossel", icon: Image },
];

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

export function AdminSidebar({ activeTab, onTabChange, onLogout }: AdminSidebarProps) {
  return (
    <Sidebar className="border-r border-border">
      <div className="p-6 flex flex-col items-center border-b border-border">
        <img src={logo} alt="Relíquia Barber" className="w-20 h-20 object-contain mb-2" />
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
                  {item.id === "carousel" && activeTab === "carousel" && (
                    <div className="px-2 py-2">
                      <CarouselPanel />
                    </div>
                  )}
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
