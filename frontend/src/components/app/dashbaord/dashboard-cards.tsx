import { Circle, CircleCheck, ClockArrowDown, FileClock, Files, Folder, RefreshCcw } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function DashbaordCards() {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Projects</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            0
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Folder/>
            </Badge>
          </CardAction>
        </CardHeader>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Documents</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            12
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Files/>
            </Badge>
          </CardAction>
        </CardHeader>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Ready for Search</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            45
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <FileClock />
            </Badge>
          </CardAction>
        </CardHeader>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Processing</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            12
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <ClockArrowDown  />
            </Badge>
          </CardAction>
        </CardHeader>
      </Card>
      <Card className="@container/card col-span-full !bg-linear-to-tr">
        <CardHeader>
          <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-xl">
            System Status
          </CardTitle>
          <CardAction>
            <Button variant="ghost" className='cursor-pointer'>
                <RefreshCcw/> 
                Refresh
            </Button>
          </CardAction>
        </CardHeader>
        <CardFooter>
          <ul className="flex justify-center items-center gap-4">
            <li className="flex justify-center items-center gap-1">
              <CircleCheck size={16} className="fill-green-500 dark:fill-green-400"  />
              <span className="text-sm font-medium">Database</span>
            </li>
            <li className="flex justify-center items-center gap-1">
              <CircleCheck size={16} className="fill-green-500 dark:fill-green-400"  />
              <span className="text-sm font-medium">Redis Queue</span>
            </li>
            <li className="flex justify-center items-center gap-1">
              <CircleCheck size={16} className="fill-green-500 dark:fill-green-400"  />
              <span className="text-sm font-medium">Workers</span>
            </li>
          </ul>
        </CardFooter>
      </Card>
    </div>
  )
}
