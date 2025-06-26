import {
  CircleCheck,
  ClockArrowDown,
  FileClock,
  Files,
  Folder,
  Logs,
  RefreshCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import axiosInstance from "@/axios";
import { useQuery } from "@/hooks/use-query";
import type { Cards, StatInfo } from "@/types/dashboard.types";

const CARDS: Cards[] = [
  {
    title: "Total Projects",
    badge: Folder,
  },
  {
    title: "Total Documents",
    badge: Files,
  },
  {
    title: "Ready for Search",
    badge: FileClock,
  },
  {
    title: "Queued",
    badge: Logs,
  },
  {
    title: "Processing",
    badge: ClockArrowDown,
  },
];

export function DashbaordCards() {
  const data = useQuery<StatInfo>({
    fn: () =>
      axiosInstance
        .get("https://jsonplaceholder.typicode.com/comments/")
        .then((res) => res.data)
        .catch(() => {}),
    key: "cards",
  });
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:animate-in *:data-[slot=card]:fade-in-0 *:data-[slot=card]:slide-in-from-bottom-15 *:data-[slot=card]:zoom-in-100 *:data-[slot=card]:duration-300 *:data-[slot=card]:transition *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {CARDS.map((card, index) => (
        <Card key={index} className="@container/card">
          <CardHeader>
            <CardDescription>{card.title}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              2
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <card.badge />
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>
      ))}
      <Card className="@container/card col-span-full col-start-2 !bg-linear-to-tr">
        <CardHeader>
          <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-xl">
            System Status
          </CardTitle>
          <CardAction>
            <Button variant="ghost" className="cursor-pointer">
              <RefreshCcw />
              Refresh
            </Button>
          </CardAction>
        </CardHeader>
        <CardFooter>
          <ul className="flex justify-center items-center gap-4">
            <li className="flex justify-center items-center gap-1">
              <CircleCheck
                size={16}
                className="fill-green-500 dark:fill-green-400"
                color="green"
              />
              <span className="text-sm font-medium">Database</span>
            </li>
            <li className="flex justify-center items-center gap-1">
              <CircleCheck
                size={16}
                className="fill-green-500 dark:fill-green-400"
                color="green"
              />
              <span className="text-sm font-medium">Queue</span>
            </li>
            <li className="flex justify-center items-center gap-1">
              <CircleCheck
                size={16}
                className="fill-green-500 dark:fill-green-400"
                color="green"
              />
              <span className="text-sm font-medium">Workers</span>
            </li>
          </ul>
        </CardFooter>
      </Card>
    </div>
  );
}
