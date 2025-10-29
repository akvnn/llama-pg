import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import axiosInstance from "@/axios";
import {
  DocumentsTable,
  schema,
} from "@/components/app/documents-table/documents-table";
import { useOrganizationStore } from "@/hooks/use-organization";
import { useProjectStore } from "@/hooks/use-project";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Project {
  project_id: string;
  project_name: string;
  description: string | null;
  number_of_documents: number;
}

interface PaginationResponse {
  items: z.infer<typeof schema>[];
  total_count: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export default function Documents() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<z.infer<typeof schema>[]>([]);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);

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
      const response = await axiosInstance.get<PaginationResponse>(
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
  }, [fetchProject]);

  useEffect(() => {
    if (project) {
      fetchDocuments();
    }
  }, [fetchDocuments, project]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !currentOrganization || !currentProject) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("document", uploadFile);
      formData.append("organization_id", currentOrganization);
      formData.append("project_id", currentProject);
      formData.append("document_name", uploadFile.name);
      const metadata = {
        title: uploadFile.name,
        url: uploadFile.name,
      };
      formData.append("metadata", JSON.stringify(metadata));

      await axiosInstance.post("/upload_document", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setUploadDialogOpen(false);
      setUploadFile(null);
      fetchDocuments();
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

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
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
                <DialogDescription>
                  Upload a new document to {project?.project_name}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="document">Document</Label>
                  <Input
                    id="document"
                    type="file"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setUploadDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={uploading}>
                    {uploading ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{project?.number_of_documents || 0} documents</span>
        </div>
      </div>

      <DocumentsTable data={documents} loading={loading} />
    </div>
  );
}
