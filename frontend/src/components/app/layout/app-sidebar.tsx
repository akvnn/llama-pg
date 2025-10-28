import * as React from "react";
import { CircleGauge, Crown, UserPlus, Search, MessageSquare, FileText, Settings2, ChevronDown, Moon, Sun } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { NavMain } from "@/components/app/layout/nav-main";
import { ContextSwitcher } from "@/components/app/layout/context-switcher";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: CircleGauge,
    },
    {
      title: "Documents",
      url: "/documents",
      icon: FileText,
    },
    {
      title: "Search",
      url: "/search",
      icon: Search,
    },
    {
      title: "RAG",
      url: "/rag",
      icon: MessageSquare,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <Crown className="!size-5" />
                <span className="text-base font-semibold">Llama-pg</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <ContextSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible defaultOpen={false} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="Settings">
                      <Settings2 />
                      <span>Settings</span>
                      <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          onClick={toggleTheme}
                          className="cursor-pointer"
                        >
                          {theme === "light" ? <Moon /> : <Sun />}
                          <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={location.pathname === "/signup"}
                        >
                          <Link to="/signup">
                            <UserPlus />
                            <span>Create User</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
