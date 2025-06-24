import { useState } from 'react'
import './index.css'
import { AppSidebar } from './components/app/app-sidebar'
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { DashbaordCards } from './components/app/dashbaord/dashboard-cards'
import { SiteHeader } from './components/app/site-header'
import { RecentDocumentsTable } from './components/app/dashbaord/recent-documents-table'

const data = [
  {
    id:1,
    title:"Readme.pdf",
    project:"akvn",
    status:"uploaded",
    size:"12kb"
  },
   {
    id:2,
    title:"cars.pdf",
    project:"tjn",
    status:"parsed",
    size:"12kb"
  }
]

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
            <SidebarInset className='z-0 h-[97svh]'>
              <SiteHeader />
        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <DashbaordCards />
            <div className='flex flex-col py-4 px-4 md:px-6 md:gap-6'>
              <h1 className='text-2xl font-semibold'>Recent Documents</h1>
              <RecentDocumentsTable data={data} />
            </div>
            </div>
          </div>
        </div>
            </SidebarInset>
          </SidebarProvider>
    </>
  )
}

export default App
