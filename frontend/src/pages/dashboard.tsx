import { DashbaordCards } from "@/components/app/dashbaord/dashboard-cards";
import Projects from "@/components/app/dashbaord/projects";
import RecentDocuments from "@/components/app/dashbaord/recent-documents";
import DashboardCardsSkeleton from "@/components/app/loaders/dashboard-cards-skeleton";
import TableSkeleton from "@/components/app/loaders/table-skeleton";
import { Suspense } from "react";

const data = [
  {
    id: 1,
    title: "ubereat.pdf",
    project: "llama-pg",
    status: "queued",
    size: "10 MB",
  },
];

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <Suspense fallback={<DashboardCardsSkeleton />}>
        <DashbaordCards />
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <RecentDocuments />
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <Projects />
      </Suspense>
    </div>
  );
}
