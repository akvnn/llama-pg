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
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface StatusChartProps {
  statusCounts: Record<string, number>;
}

const chartConfig = {
  count: {
    label: "Documents",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function StatusChart({ statusCounts }: StatusChartProps) {
  const chartData = Object.entries(statusCounts || {}).map(
    ([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
      fill: getStatusColor(status),
    })
  );

  function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      queued: "hsl(var(--chart-1))",
      parsing: "hsl(var(--chart-2))",
      embedded: "hsl(var(--chart-3))",
      failed: "hsl(var(--chart-4))",
    };
    return colors[status] || "hsl(var(--chart-5))";
  }

  const total = Object.values(statusCounts || {}).reduce((a, b) => a + b, 0);

  if (!statusCounts || Object.keys(statusCounts).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Document Processing Status</CardTitle>
          <CardDescription>No documents yet</CardDescription>
        </CardHeader>
        <CardContent className="h-[250px] flex items-center justify-center text-muted-foreground">
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
          Distribution of documents across processing stages ({total} total)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart data={chartData} accessibilityLayer>
            <CartesianGrid vertical={false} />
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
