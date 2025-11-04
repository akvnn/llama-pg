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
  documentsPerProject?: Record<string, number>;
}

const chartConfig = {
  count: {
    label: "Documents",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function DefaultBarChart({ documentsPerProject }: DefaultBarChartProps) {
  const chartData = documentsPerProject
    ? Object.entries(documentsPerProject).map(([project, count]) => ({
        project,
        count,
        fill: "var(--color-count)",
      }))
    : [];

  const total = chartData.reduce((sum, item) => sum + item.count, 0);

  if (!documentsPerProject || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents per Project</CardTitle>
          <CardDescription>No projects yet</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          <p>Create projects to see distribution</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents per Project</CardTitle>
        <CardDescription>
          Distribution of {total} documents across {chartData.length} project{chartData.length !== 1 ? "s" : ""}
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
              dataKey="project"
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
