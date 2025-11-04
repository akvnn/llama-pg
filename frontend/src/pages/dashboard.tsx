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
import type { Project } from "@/types/project.types";
import { DefaultBarChart } from "@/components/ui/default-bar-chart";
import { RoundedPieChart } from "@/components/ui/rounded-pie-chart";

export default function Dashboard() {
  const currentOrganization = useOrganizationStore(
    (state) => state.currentOrganization
  );

  const [stats, setStats] = useState<StatInfo | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentOrganization) {
        setStats(null);
        setProjects([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const [statsResponse, projectsResponse] = await Promise.all([
          axiosInstance.get("/stats", {
            params: { organization_id: currentOrganization },
          }),
          axiosInstance.get("/projects_info", {
            params: {
              organization_id: currentOrganization,
              page: 1,
              per_page: 100,
            },
          }),
        ]);

        setStats(statsResponse.data);
        setProjects(projectsResponse.data.items || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setStats(null);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentOrganization]);

  const documentsPerProject: Record<string, number> = {};

  projects.forEach((project) => {
    documentsPerProject[project.project_name] = project.number_of_documents;
  });

  const statData = stats || {
    total_count: 0,
    projects_count: 0,
    status_counts: {} as Record<string, number>,
  };

  const statusCounts = statData.status_counts || ({} as Record<string, number>);
  const readyCount = statusCounts["Ready for Search"] || 0;
  const pendingCount = statusCounts["Pending"] || 0;
  const queuedEmbeddingCount = statusCounts["Queued for Embedding"] || 0;

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

        <Card className="relative overflow-hidden border-chart-2/30">
          <CardHeader>
            <CardDescription>Ready for Search</CardDescription>
            <CardTitle className="text-3xl font-bold tabular-nums text-chart-2">
              {readyCount}
            </CardTitle>
            <div className="absolute right-4 top-4">
              <Badge
                variant="outline"
                className="h-10 w-10 rounded-full p-0 flex items-center justify-center border-chart-2/30"
              >
                <FileClock className="h-5 w-5 text-chart-2" />
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Card className="relative overflow-hidden border-chart-1/30">
          <CardHeader>
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl font-bold tabular-nums text-chart-1">
              {pendingCount}
            </CardTitle>
            <div className="absolute right-4 top-4">
              <Badge
                variant="outline"
                className="h-10 w-10 rounded-full p-0 flex items-center justify-center border-chart-1/30"
              >
                <Logs className="h-5 w-5 text-chart-1" />
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Card className="relative overflow-hidden border-chart-4/30">
          <CardHeader>
            <CardDescription>Queued for Embedding</CardDescription>
            <CardTitle className="text-3xl font-bold tabular-nums text-chart-4">
              {queuedEmbeddingCount}
            </CardTitle>
            <div className="absolute right-4 top-4">
              <Badge
                variant="outline"
                className="h-10 w-10 rounded-full p-0 flex items-center justify-center border-chart-4/30"
              >
                <ClockArrowDown className="h-5 w-5 text-chart-4" />
              </Badge>
            </div>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 px-4 lg:px-6 md:grid-cols-2">
        <DefaultBarChart documentsPerProject={documentsPerProject} />
        <RoundedPieChart
          documentTypeDistribution={statusCounts}
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
