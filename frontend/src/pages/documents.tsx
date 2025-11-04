import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/axios";
import { DocumentsTable } from "@/components/app/documents-table/documents-table";
import { useOrganizationStore } from "@/hooks/use-organization";
import { useProjectStore } from "@/hooks/use-project";
import { Alert, AlertDescription } from "@/components/ui/alert";
import UploadDocuments from "@/components/app/documents/upload documents";
import type { Project } from "@/types/project.types";
import type { PaginationResponse } from "@/types/api.types";
import type { Document } from "@/types/document.types";

export default function Documents() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const currentOrganization = useOrganizationStore(
    (state) => state.currentOrganization
  );
  const currentProject = useProjectStore((state) => state.currentProject);

  const fetchProject = useCallback(async () => {
    if (!currentOrganization || !currentProject) return;

    try {
      const response = await axiosInstance.get("/projects_info", {
        params: {
          page: 1,
          per_page: 100,
          organization_id: currentOrganization,
        },
      });
      const projectData = response.data.items.find(
        (p: Project) => p.project_id === currentProject
      );
      setProject(projectData || null);
    } catch (error) {
      console.error("Failed to fetch project:", error);
    }
  }, [currentOrganization, currentProject]);

  const fetchDocuments = useCallback(async () => {
    if (!currentOrganization || !currentProject) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.get<PaginationResponse<Document>>(
        "/recent_documents_info",
        {
          params: {
            page: 1,
            per_page: 50,
            organization_id: currentOrganization,
          },
        }
      );

      const projectDocuments = response.data.items.filter(
        (doc) => doc.project_name === project?.project_name
      );
      setDocuments(projectDocuments);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization, currentProject, project?.project_name]);

  useEffect(() => {
    fetchProject();
  }, [currentOrganization, currentProject]);

  useEffect(() => {
    if (project) {
      fetchDocuments();
    }
  }, [project, currentOrganization, currentProject]);

  if (!currentProject) {
    return (
      <div className="flex flex-col gap-6 py-4 md:py-6 px-5">
        <Alert>
          <AlertDescription>
            Please select a project from the sidebar to view documents
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!project && !loading) {
    return (
      <div className="flex flex-col gap-6 py-4 md:py-6 px-5">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Project not found</h1>
          <p className="text-muted-foreground mt-2">
            The project you're looking for doesn't exist or you don't have
            access to it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6 px-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{project?.project_name}</h1>
            {project?.description && (
              <p className="text-muted-foreground mt-1">
                {project.description}
              </p>
            )}
          </div>
          <UploadDocuments
            uploadDialogOpen={uploadDialogOpen}
            setUploadDialogOpen={setUploadDialogOpen}
            project={project}
            selectedFiles={selectedFiles}
            setSelectedFiles={setSelectedFiles}
            currentOrganization={currentOrganization}
            fetchDocuments={fetchDocuments}
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{project?.number_of_documents || 0} documents</span>
        </div>
      </div>

      <DocumentsTable data={documents} loading={loading} />
    </div>
  );
}
