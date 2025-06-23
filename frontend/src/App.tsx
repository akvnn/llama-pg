import { useState } from 'react'
import './index.css'
import { AppSidebar } from './components/app/app-sidebar'
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { DashbaordCards } from './components/app/dashboard-cards'
import { SiteHeader } from './components/app/site-header'
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <SidebarProvider
            style={
              {
                "--sidebar-width": "calc(var(--spacing) * 65)",
                "--header-height": "calc(var(--spacing) * 12)",
              } as React.CSSProperties
            }
          >
            <AppSidebar variant="inset" />
            <SidebarInset>
              <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <DashbaordCards />
            </div>
          </div>
        </div>
            </SidebarInset>
          </SidebarProvider>
    </>
  )
}

export default App
