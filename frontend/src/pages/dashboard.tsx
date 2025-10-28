import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Folder, Files, FileClock, Logs, ClockArrowDown } from "lucide-react";
import Projects from "@/components/app/dashbaord/projects";
import RecentDocuments from "@/components/app/dashbaord/recent-documents";
import { Suspense } from "react";
import TableSkeleton from "@/components/app/loaders/table-skeleton";
import { useOrganizationStore } from "@/hooks/use-organization";
import axiosInstance from "@/axios";
import type { StatInfo } from "@/types/dashboard.types";
import { DefaultBarChart } from "@/components/ui/default-bar-chart";
import { RoundedPieChart } from "@/components/ui/rounded-pie-chart";

export default function Dashboard() {
  const currentOrganization = useOrganizationStore(
    (state) => state.currentOrganization
  );

  const [stats, setStats] = useState<StatInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!currentOrganization) {
        setStats(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axiosInstance.get("/stats", {
          params: {
            organization_id: currentOrganization,
          },
        });
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching stats:", error);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [currentOrganization]);

  const statData = stats || {
    total_count: 0,
    projects_count: 0,
    status_counts: {},
  };

  const statusCounts = statData.status_counts || {};
  const readyCount = statusCounts["embedded"] || 0;
  const queuedCount = statusCounts["queued"] || 0;
  const processingCount = statusCounts["parsing"] || 0;

  if (loading) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="grid grid-cols-1 gap-4 px-4 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-[120px] bg-muted animate-pulse rounded-lg"
            />
          ))}
        </div>
        <div className="grid gap-4 px-4 md:grid-cols-2">
          <div className="h-[400px] bg-muted animate-pulse rounded-lg" />
          <div className="h-[400px] bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="grid grid-cols-1 gap-4 px-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="relative overflow-hidden">
          <CardHeader>
            <CardDescription>Total Projects</CardDescription>
            <CardTitle className="text-3xl font-bold tabular-nums">
              {statData.projects_count}
            </CardTitle>
            <div className="absolute right-4 top-4">
              <Badge
                variant="outline"
                className="h-10 w-10 rounded-full p-0 flex items-center justify-center"
              >
                <Folder className="h-5 w-5" />
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader>
            <CardDescription>Total Documents</CardDescription>
            <CardTitle className="text-3xl font-bold tabular-nums">
              {statData.total_count}
            </CardTitle>
            <div className="absolute right-4 top-4">
              <Badge
                variant="outline"
                className="h-10 w-10 rounded-full p-0 flex items-center justify-center"
              >
                <Files className="h-5 w-5" />
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Card className="relative overflow-hidden border-green-200 dark:border-green-900">
          <CardHeader>
            <CardDescription>Ready for Search</CardDescription>
            <CardTitle className="text-3xl font-bold tabular-nums text-green-600 dark:text-green-400">
              {readyCount}
            </CardTitle>
            <div className="absolute right-4 top-4">
              <Badge
                variant="outline"
                className="h-10 w-10 rounded-full p-0 flex items-center justify-center border-green-200 dark:border-green-900"
              >
                <FileClock className="h-5 w-5 text-green-600 dark:text-green-400" />
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Card className="relative overflow-hidden border-blue-200 dark:border-blue-900">
          <CardHeader>
            <CardDescription>Queued</CardDescription>
            <CardTitle className="text-3xl font-bold tabular-nums text-blue-600 dark:text-blue-400">
              {queuedCount}
            </CardTitle>
            <div className="absolute right-4 top-4">
              <Badge
                variant="outline"
                className="h-10 w-10 rounded-full p-0 flex items-center justify-center border-blue-200 dark:border-blue-900"
              >
                <Logs className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Card className="relative overflow-hidden border-amber-200 dark:border-amber-900">
          <CardHeader>
            <CardDescription>Processing</CardDescription>
            <CardTitle className="text-3xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
              {processingCount}
            </CardTitle>
            <div className="absolute right-4 top-4">
              <Badge
                variant="outline"
                className="h-10 w-10 rounded-full p-0 flex items-center justify-center border-amber-200 dark:border-amber-900"
              >
                <ClockArrowDown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </Badge>
            </div>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 px-4 lg:px-6 md:grid-cols-2">
        <DefaultBarChart statusCounts={statusCounts} />
        <RoundedPieChart
          statusCounts={statusCounts}
          totalCount={statData.total_count}
        />
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <RecentDocuments />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <Projects />
      </Suspense>
    </div>
  );
}
