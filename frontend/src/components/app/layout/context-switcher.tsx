import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Plus, Folder } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import axiosInstance from "@/axios";
import type { Organization } from "@/types/org.types";
import { useOrganizationStore } from "@/hooks/use-organization";
import { useProjectStore } from "@/hooks/use-project";
import { z } from "zod";

const projectSchema = z.object({
  project_id: z.string(),
  project_name: z.string(),
  number_of_documents: z.number(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  description: z.string().nullable(),
});

interface PaginationResponse {
  items: z.infer<typeof projectSchema>[];
  total_count: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export function ContextSwitcher() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isCreateOrgDialogOpen, setIsCreateOrgDialogOpen] = useState(false);
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] =
    useState(false);
  const [organizationName, setOrganizationName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  const [projects, setProjects] = useState<z.infer<typeof projectSchema>[]>([]);
  const [selectedProject, setSelectedProject] = useState<z.infer<
    typeof projectSchema
  > | null>(null);
  const [projectsLoading, setProjectsLoading] = useState(false);

  const setCurrentOrganization = useOrganizationStore(
    (state) => state.setCurrentOrganization
  );
  const currentOrganization = useOrganizationStore(
    (state) => state.currentOrganization
  );
  const setCurrentProject = useProjectStore((state) => state.setCurrentProject);
  const currentProject = useProjectStore((state) => state.currentProject);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get<Organization[]>(
          "/organizations"
        );
        setOrganizations(response.data);
        if (response.data.length > 0) {
          if (currentOrganization) {
            const org =
              response.data.find((org) => org.id === currentOrganization) ||
              response.data[0];
            setSelectedOrg(org);
            setCurrentOrganization(org.id);
          } else {
            setSelectedOrg(response.data[0]);
            setCurrentOrganization(response.data[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch organizations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!selectedOrg) return;

      try {
        setProjectsLoading(true);
        const response = await axiosInstance.get<PaginationResponse>(
          "/projects_info",
          {
            params: {
              page: 1,
              per_page: 100,
              organization_id: selectedOrg.id,
            },
          }
        );
        setProjects(response.data.items);

        if (response.data.items.length > 0) {
          if (currentProject) {
            const project = response.data.items.find(
              (p) => p.project_id === currentProject
            );
            if (project) {
              setSelectedProject(project);
            } else {
              setSelectedProject(response.data.items[0]);
              setCurrentProject(response.data.items[0].project_id);
            }
          } else {
            setSelectedProject(response.data.items[0]);
            setCurrentProject(response.data.items[0].project_id);
          }
        } else {
          setSelectedProject(null);
          setCurrentProject(null);
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setProjectsLoading(false);
      }
    };

    fetchProjects();
  }, [selectedOrg]);

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationName) return;

    try {
      setCreating(true);
      await axiosInstance.post("/create_organization", {
        name: organizationName,
      });

      setIsCreateOrgDialogOpen(false);
      setOrganizationName("");

      const response = await axiosInstance.get<Organization[]>(
        "/organizations"
      );
      setOrganizations(response.data);
      if (response.data.length > 0) {
        const newOrg = response.data[response.data.length - 1];
        setSelectedOrg(newOrg);
        setCurrentOrganization(newOrg.id);
      }
    } catch (error) {
      console.error("Organization creation failed:", error);
      alert("Failed to create organization");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName || !selectedOrg) return;

    try {
      setCreating(true);
      await axiosInstance.post("/create_project", {
        project_name: projectName,
        project_description: projectDescription,
        organization_id: selectedOrg.id,
      });

      setIsCreateProjectDialogOpen(false);
      setProjectName("");
      setProjectDescription("");

      const response = await axiosInstance.get<PaginationResponse>(
        "/projects_info",
        {
          params: {
            page: 1,
            per_page: 100,
            organization_id: selectedOrg.id,
          },
        }
      );
      setProjects(response.data.items);
      if (response.data.items.length > 0) {
        const newProject = response.data.items[response.data.items.length - 1];
        setSelectedProject(newProject);
        setCurrentProject(newProject.project_id);
      }
    } catch (error) {
      console.error("Project creation failed:", error);
      alert("Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading || !selectedOrg) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <span className="text-sm font-semibold">...</span>
            </div>
            <div className="flex flex-col gap-0.5 leading-none">
              <span className="font-semibold">Loading...</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <span className="text-sm font-semibold">
                    {getInitials(selectedOrg.name)}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">{selectedOrg.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {selectedOrg.role}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width]"
              align="start"
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Organizations
              </DropdownMenuLabel>
              {organizations.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onSelect={() => {
                    setSelectedOrg(org);
                    setCurrentOrganization(org.id);
                  }}
                  className="gap-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-sm bg-sidebar-primary text-sidebar-primary-foreground">
                    <span className="text-xs font-medium">
                      {getInitials(org.name)}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm">{org.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {org.role}
                    </span>
                  </div>
                  {org.id === selectedOrg.id && (
                    <Check className="ml-auto size-4" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setIsCreateOrgDialogOpen(true)}
                className="gap-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <Plus className="size-4" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  Create Organization
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>

        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                disabled={projectsLoading || projects.length === 0}
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted">
                  <Folder className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">
                    {projectsLoading
                      ? "Loading..."
                      : selectedProject
                      ? selectedProject.project_name
                      : "No Project"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {selectedProject
                      ? `${selectedProject.number_of_documents} documents`
                      : "Create a project"}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width]"
              align="start"
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Projects
              </DropdownMenuLabel>
              {projects.map((project) => (
                <DropdownMenuItem
                  key={project.project_id}
                  onSelect={() => {
                    setSelectedProject(project);
                    setCurrentProject(project.project_id);
                  }}
                  className="gap-2"
                >
                  <Folder className="size-4" />
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm">{project.project_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {project.number_of_documents} documents
                    </span>
                  </div>
                  {selectedProject?.project_id === project.project_id && (
                    <Check className="ml-auto size-4" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setIsCreateProjectDialogOpen(true)}
                className="gap-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <Plus className="size-4" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  Create Project
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog
        open={isCreateOrgDialogOpen}
        onOpenChange={setIsCreateOrgDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>
              Create a new organization to manage your projects and documents
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateOrganization} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Enter organization name"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOrgDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCreateProjectDialogOpen}
        onOpenChange={setIsCreateProjectDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>
              Create a new project in {selectedOrg.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Description</Label>
              <Textarea
                id="project-description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Enter project description (optional)"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateProjectDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
