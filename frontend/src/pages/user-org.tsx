import { useState, useEffect } from "react";
import { useOrganizationStore } from "@/hooks/use-organization";
import axiosInstance from "@/axios";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users } from "lucide-react";
import { AddUserForm } from "@/components/app/user-org/add-user-form";
import { OrganizationUsersTable } from "@/components/app/user-org/organization-users-table";
import type { OrganizationUser } from "@/types/org.types";
import type { User } from "@/types/user.types";

export default function UserOrg() {
  const currentOrganization = useOrganizationStore(
    (state) => state.currentOrganization
  );

  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [removeUserLoading, setRemoveUserLoading] = useState<string | null>(
    null
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchAllUsers = async () => {
    try {
      const response = await axiosInstance.get("/users");
      setAllUsers(response.data);
    } catch (error: any) {
      console.error("Error fetching all users:", error);
    }
  };

  const fetchUsers = async () => {
    if (!currentOrganization) {
      setUsers([]);
      setLoading(false);

      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/organization/${currentOrganization}/users`
      );
      setUsers(response.data);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      setError(error.response?.data?.detail || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [currentOrganization]);

  const availableUsers = allUsers.filter(
    (user) => !users.some((orgUser) => orgUser.username === user.username)
  );

  const handleAddUser = async (username: string, role: "admin" | "member") => {
    setError("");
    setSuccess("");

    if (!currentOrganization) {
      setError("No organization selected");
      return;
    }

    setAddUserLoading(true);

    try {
      await axiosInstance.post(
        `/organization/${currentOrganization}/add_user`,
        {
          username,
          role,
        }
      );

      setSuccess(`User "${username}" added successfully!`);
      await fetchUsers();
    } catch (error: any) {
      setError(error.response?.data?.detail || "Failed to add user");
    } finally {
      setAddUserLoading(false);
    }
  };

  const handleRemoveUser = async (username: string) => {
    if (!currentOrganization) {
      setError("No organization selected");
      return;
    }

    if (!confirm(`Are you sure you want to remove user "${username}"?`)) {
      return;
    }

    setError("");
    setSuccess("");
    setRemoveUserLoading(username);

    try {
      await axiosInstance.post(
        `/organization/${currentOrganization}/kick_user`,
        {
          username,
        }
      );

      setSuccess(`User "${username}" removed successfully!`);

      await fetchUsers();
    } catch (error: any) {
      setError(error.response?.data?.detail || "Failed to remove user");
    } finally {
      setRemoveUserLoading(null);
    }
  };

  if (!currentOrganization) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Organization Selected</CardTitle>
            <CardDescription>
              Please select an organization to manage users
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-6 px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Manage Organization</h1>
          <p className="text-muted-foreground">
            Add or remove users from your organization
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-chart-3/10 p-4">
          <p className="text-sm text-chart-3">
            {success}
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <AddUserForm
          availableUsers={availableUsers}
          onAddUser={handleAddUser}
          loading={addUserLoading}
        />

        <OrganizationUsersTable
          users={users}
          loading={loading}
          onRemoveUser={handleRemoveUser}
          removeUserLoading={removeUserLoading}
        />
      </div>
    </div>
  );
}
