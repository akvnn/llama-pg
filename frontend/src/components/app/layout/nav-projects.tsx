import { useEffect, useState, useCallback } from "react";
import { ChevronDown, ChevronRight, Folder, Plus, Search } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import { Link, useLocation } from "react-router-dom";
import { useOrganizationStore } from "@/hooks/use-organization";
import axiosInstance from "@/axios";
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

export function NavProjects() {
  const location = useLocation();
  const currentOrganization = useOrganizationStore(
    (state) => state.currentOrganization
  );

  const [isExpanded, setIsExpanded] = useState(false);
  const [projects, setProjects] = useState<z.infer<typeof projectSchema>[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<
    z.infer<typeof projectSchema>[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchProjects = useCallback(async () => {
    if (!currentOrganization) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.get<PaginationResponse>(
        "/projects_info",
        {
          params: {
            page: 1,
            per_page: 100,
            organization_id: currentOrganization,
          },
        }
      );
      setProjects(response.data.items);
      setFilteredProjects(response.data.items);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization]);

  useEffect(() => {
    if (isExpanded) {
      fetchProjects();
    }
  }, [isExpanded, fetchProjects]);

  useEffect(() => {
    const filtered = projects.filter((project) =>
      project.project_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProjects(filtered);
  }, [searchQuery, projects]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName || !currentOrganization) return;

    try {
      setCreating(true);
      await axiosInstance.post("/create_project", {
        project_name: projectName,
        project_description: projectDescription,
        organization_id: currentOrganization,
      });

      setCreateDialogOpen(false);
      setProjectName("");
      setProjectDescription("");
      fetchProjects();
    } catch (error) {
      console.error("Project creation failed:", error);
      alert("Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setIsExpanded(!isExpanded)}
              tooltip="Projects"
              className="w-full"
            >
              <Folder />
              <span>Projects</span>
              {isExpanded ? (
                <ChevronDown className="ml-auto" />
              ) : (
                <ChevronRight className="ml-auto" />
              )}
            </SidebarMenuButton>

            {isExpanded && (
              <SidebarMenuSub>
                <div className="px-3 py-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search projects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-9"
                    />
                  </div>
                </div>
                <div className="px-3 pb-2">
                  <Dialog
                    open={createDialogOpen}
                    onOpenChange={setCreateDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" className="w-full" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Project
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Project</DialogTitle>
                        <DialogDescription>
                          Create a new project in your organization
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreate} className="space-y-4">
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
                          <Label htmlFor="project-description">
                            Description
                          </Label>
                          <Textarea
                            id="project-description"
                            value={projectDescription}
                            onChange={(e) =>
                              setProjectDescription(e.target.value)
                            }
                            placeholder="Enter project description (optional)"
                            rows={3}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCreateDialogOpen(false)}
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
                </div>
                {loading ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Loading projects...
                  </div>
                ) : filteredProjects.length > 0 ? (
                  <div className="max-h-[200px] overflow-y-auto">
                    {filteredProjects.slice(0, 5).map((project) => (
                      <SidebarMenuSubItem key={project.project_id}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={location.pathname.includes(
                            `/project/${project.project_id}`
                          )}
                        >
                          <Link to={`/project/${project.project_id}`}>
                            <span className="truncate">
                              {project.project_name}
                            </span>
                            <span className="ml-auto text-xs text-muted-foreground">
                              {project.number_of_documents}
                            </span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                    {filteredProjects.length > 5 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                        +{filteredProjects.length - 5} more projects
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    {searchQuery
                      ? "No projects found"
                      : "No projects yet. Create one!"}
                  </div>
                )}
              </SidebarMenuSub>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
