import { Pie, PieChart } from "recharts";

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
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

interface RoundedPieChartProps {
  documentTypeDistribution?: Record<string, number>;
  totalCount?: number;
}

const statusColors: Record<string, string> = {
  "Ready for Search": "var(--chart-2)",
  Pending: "var(--chart-1)",
  "Queued for Parsing": "var(--chart-4)",
  "Queued for Embedding": "var(--chart-5)",
  Failed: "var(--destructive)",
};

const generateChartConfig = (statuses: string[]): ChartConfig => {
  const config: ChartConfig = {
    documents: {
      label: "Documents",
    },
  };

  statuses.forEach((status) => {
    config[status] = {
      label: status,
      color: statusColors[status] || "var(--chart-4)",
    };
  });

  return config;
};

export function RoundedPieChart({
  documentTypeDistribution,
  totalCount = 0,
}: RoundedPieChartProps) {
  const chartData = documentTypeDistribution
    ? Object.entries(documentTypeDistribution)
        .filter(([_, count]) => count > 0)
        .map(([type, count]) => ({
          type,
          documents: count,
          fill: statusColors[type] || "var(--chart-4)",
        }))
    : [];

  const chartConfig = generateChartConfig(
    documentTypeDistribution ? Object.keys(documentTypeDistribution) : []
  );

  if (!documentTypeDistribution || chartData.length === 0) {
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
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent nameKey="documents" hideLabel />}
            />
            <Pie
              data={chartData}
              innerRadius={60}
              dataKey="documents"
              nameKey="type"
              radius={10}
              cornerRadius={8}
              paddingAngle={4}
            />
            <ChartLegend
              content={<ChartLegendContent nameKey="type" />}
              className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
