import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, User as UserIcon } from "lucide-react";
import axiosInstance from "@/axios";
import { useOrganizationStore } from "@/hooks/use-organization";
import { CreateUserForm } from "@/components/app/user/create-user-form";
import { UsersTable } from "@/components/app/user/users-table";
import { ServiceAccountsTable } from "@/components/app/user/service-accounts-table";
import type { User, ServiceAccount } from "@/types/user.types";

export default function User() {
  const { currentOrganization } = useOrganizationStore();
  const [activeTab, setActiveTab] = useState<"users" | "service-accounts">(
    "users"
  );

  const [users, setUsers] = useState<User[]>([]);
  const [serviceAccounts, setServiceAccounts] = useState<ServiceAccount[]>([]);

  const [creating, setCreating] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [fetchingSAs, setFetchingSAs] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchUsers = async () => {
    setFetchingUsers(true);
    try {
      const response = await axiosInstance.get(
        `/organization/${currentOrganization}/users`
      );
      setUsers(response.data);
    } catch (err: any) {
      console.error("Error fetching users:", err);
    } finally {
      setFetchingUsers(false);
    }
  };

  const fetchServiceAccounts = async () => {
    if (!currentOrganization) return;

    setFetchingSAs(true);
    try {
      const response = await axiosInstance.get(
        `/organization/${currentOrganization}/sa`
      );
      setServiceAccounts(response.data);
    } catch (err: any) {
      console.error("Error fetching service accounts:", err);
    } finally {
      setFetchingSAs(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    if (currentOrganization) {
      fetchServiceAccounts();
    }
  }, [currentOrganization]);

  const validateForm = (
    username: string,
    password: string,
    confirmPassword: string
  ) => {
    if (!username.trim()) {
      setError("Username is required");
      return false;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (
    username: string,
    password: string,
    confirmPassword: string
  ) => {
    setError("");
    setSuccess("");

    if (!validateForm(username, password, confirmPassword)) return;

    const isServiceAccount = activeTab === "service-accounts";

    if (isServiceAccount && !currentOrganization) {
      setError("Please select an organization to create a service account");
      return;
    }

    setCreating(true);
    try {
      const signupResponse = await axiosInstance.post("/signup", {
        username,
        password,
        is_service_account: isServiceAccount,
      });

      if (isServiceAccount && currentOrganization) {
        const userId = signupResponse.data.org_ids[0];

        if (userId !== currentOrganization) {
          try {
            await axiosInstance.post(
              `/organization/${currentOrganization}/add_user`,
              {
                username,
                role: "member",
              }
            );
          } catch (err: any) {
            console.error("Error adding SA to organization:", err);
          }
        }
      }

      setSuccess(
        isServiceAccount
          ? "Service account created successfully"
          : "User created successfully"
      );

      if (isServiceAccount) {
        await fetchServiceAccounts();
      } else {
        await fetchUsers();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Error creating user";
      setError(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-1">
          Create and manage users and service accounts
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "users" | "service-accounts")}
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            Regular Users
          </TabsTrigger>
          <TabsTrigger
            value="service-accounts"
            className="flex items-center gap-2"
          >
            <Bot className="h-4 w-4" />
            Service Accounts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <CreateUserForm
            onSubmit={handleSubmit}
            creating={creating}
            error={error}
            success={success}
            isServiceAccount={false}
          />

          <UsersTable users={users} loading={fetchingUsers} />
        </TabsContent>

        <TabsContent value="service-accounts" className="space-y-6">
          <CreateUserForm
            onSubmit={handleSubmit}
            creating={creating}
            error={error}
            success={success}
            isServiceAccount={true}
            currentOrganization={currentOrganization}
          />

          <ServiceAccountsTable
            serviceAccounts={serviceAccounts}
            loading={fetchingSAs}
            currentOrganization={currentOrganization}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
