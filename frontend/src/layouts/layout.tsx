import { AppSidebar } from "@/components/app/layout/app-sidebar";
import { SiteHeader } from "@/components/app/layout/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <SidebarProvider
            style={
              {
                "--sidebar-width": "calc(var(--spacing) * 65)",
                "--header-height": "calc(var(--spacing) * 12)",
              } as React.CSSProperties
            }
          >
            <AppSidebar variant="inset" />
            <SidebarInset className='z-0 h-[97svh] overflow-y-hidden'>
              <SiteHeader />
        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <Outlet/>
          </div>
        </div>
            </SidebarInset>
          </SidebarProvider>
  )
}
