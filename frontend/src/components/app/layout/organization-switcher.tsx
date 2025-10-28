import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
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
import axiosInstance from "@/axios";
import type { Organization } from "@/types/org.types";
import { useOrganizationStore } from "@/hooks/use-organization";

export function OrganizationSwitcher() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [organizationName, setOrganizationName] = useState("");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const setCurrentOrganization = useOrganizationStore(
    (state) => state.setCurrentOrganization
  );
  const currentOrganization = useOrganizationStore(
    (state) => state.currentOrganization
  );

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
            setSelectedOrg(
              response.data.find((org) => org.id === currentOrganization) ||
                response.data[0]
            );
            setCurrentOrganization(currentOrganization);
            return;
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

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationName) return;

    try {
      setCreating(true);
      await axiosInstance.post("/create_organization", {
        name: organizationName,
      });

      setIsCreateDialogOpen(false);
      setOrganizationName("");

      const response = await axiosInstance.get<Organization[]>(
        "/organizations"
      );
      setOrganizations(response.data);
      if (response.data.length > 0) {
        setSelectedOrg(response.data[response.data.length - 1]);
        setCurrentOrganization(response.data[response.data.length - 1].id);
      }
    } catch (error) {
      console.error("Organization creation failed:", error);
      alert("Failed to create organization");
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
                onSelect={() => setIsCreateDialogOpen(true)}
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
      </SidebarMenu>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                onClick={() => setIsCreateDialogOpen(false)}
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
