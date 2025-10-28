import { Bar, BarChart, XAxis, CartesianGrid, YAxis } from "recharts";
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

interface DefaultBarChartProps {
  statusCounts?: Record<string, number>;
}

const chartConfig = {
  count: {
    label: "Documents",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function DefaultBarChart({ statusCounts }: DefaultBarChartProps) {
  const chartData = statusCounts
    ? Object.entries(statusCounts).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
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

  const total = chartData.reduce((sum, item) => sum + item.count, 0);

  if (!statusCounts || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Document Processing Status</CardTitle>
          <CardDescription>No documents yet</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          <p>Upload documents to see processing status</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Processing Status</CardTitle>
        <CardDescription>
          Distribution of {total} documents across processing stages
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              opacity={0.3}
            />
            <XAxis
              dataKey="status"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={10} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="count" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
