import ProjectsTable from "../projects-table/projects-table";
import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/axios";
import { useOrganizationStore } from "@/hooks/use-organization";
import type { Project } from "@/types/project.types";
import type { PaginationResponse } from "@/types/api.types";

export default function Projects() {
  const currentOrganization = useOrganizationStore(
    (state) => state.currentOrganization
  );
  const [data, setData] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      const response = await axiosInstance.get<PaginationResponse<Project>>(
        "/projects_info",
        {
          params: {
            page: 1,
            per_page: 5,
            organization_id: currentOrganization,
          },
        }
      );

      console.log("Fetched projects:", response.data.items);

      setData(response.data.items);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <div className="flex flex-col py-4 px-4 md:px-6 gap-6  animate-in fade-in-0 slide-in-from-left-10 zoom-in-100 duration-300 transition">
      <h1 className="text-2xl font-semibold">Projects</h1>
      <ProjectsTable data={data} limit={10} loading={loading} />
    </div>
  );
}
