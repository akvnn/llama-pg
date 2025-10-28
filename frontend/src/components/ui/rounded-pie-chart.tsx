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
  documents: {
    label: "Documents",
  },
  embedded: {
    label: "Ready",
    color: "var(--chart-1)",
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
    const colors: Record<string, string> = {
      queued: "hsl(var(--chart-3))",
      parsing: "hsl(var(--chart-2))",
      embedded: "hsl(var(--chart-1))",
      failed: "hsl(var(--chart-4))",
    };
    return colors[status] || "hsl(var(--chart-5))";
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
