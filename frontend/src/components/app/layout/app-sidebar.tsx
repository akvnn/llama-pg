import * as React from "react"
import {
  ChartSpline ,
  CircleGauge,
  Folder,
  Crown,
  Activity,
  Files 
} from "lucide-react"

import { NavMain } from "@/components/app/layout/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: CircleGauge ,
    },
    {
      title: "Projects",
      url: "/projects",
      icon: Folder,
    },
    {
      title: "Documents",
      url: "/documents",
      icon: Files,
    },
    {
      title: "Metrics",
      url: "/metrics",
      icon: ChartSpline ,
    },
    {
      title: "Activity",
      url: "/activity",
      icon: Activity ,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
                <Crown  className="!size-5" />
                <span className="text-base font-semibold">Llama-pg</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
    </Sidebar>
  )
}
