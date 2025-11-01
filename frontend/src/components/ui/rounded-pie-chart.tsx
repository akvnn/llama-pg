import { LabelList, Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface RoundedPieChartProps {
  statusCounts?: Record<string, number>;
  totalCount?: number;
}

const chartConfig = {
  Pending: {
    label: "Pending",
    color: "#FFFFFF",
  },
  documents: {
    label: "Documents",
  },
  embedded: {
    label: "Ready",
    color: "#FFFFFF",
  },
  parsing: {
    label: "Processing",
    color: "var(--chart-2)",
  },
  queued: {
    label: "Queued",
    color: "var(--chart-3)",
  },
  failed: {
    label: "Failed",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

export function RoundedPieChart({
  statusCounts,
  totalCount = 0,
}: RoundedPieChartProps) {
  const chartData = statusCounts
    ? Object.entries(statusCounts)
        .filter(([_, count]) => count > 0)
        .map(([status, count]) => ({
          status: status.charAt(0).toUpperCase() + status.slice(1),
          documents: count,
          fill: getStatusColor(status),
        }))
    : [];

  function getStatusColor(status: string): string {
    const isDark = document.documentElement.classList.contains("dark");
    const colors: Record<string, string> = isDark
      ? {
          queued: "#c9a030",
          parsing: "#5fcba4",
          embedded: "#8b5cf6",
          failed: "#d946ef",
        }
      : {
          queued: "#4b5563",
          parsing: "#06b6d4",
          embedded: "#f59e0b",
          failed: "#eab308",
        };
    return colors[status] || (isDark ? "#f87171" : "#ec4899");
  }

  if (!statusCounts || chartData.length === 0) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Document Status Distribution</CardTitle>
          <CardDescription>No documents yet</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          <p>Upload documents to see status distribution</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Document Status Distribution</CardTitle>
        <CardDescription>
          {totalCount} total document{totalCount !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent nameKey="documents" hideLabel />}
            />
            <Pie
              data={chartData}
              innerRadius={30}
              dataKey="documents"
              radius={10}
              cornerRadius={8}
              paddingAngle={4}
            >
              <LabelList
                dataKey="documents"
                stroke="none"
                fontSize={12}
                fontWeight={500}
                fill="currentColor"
                formatter={(value: number) => value.toString()}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
