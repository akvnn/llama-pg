import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import type { User } from "@/types/user.types";

interface AddUserFormProps {
  availableUsers: User[];
  onAddUser: (username: string, role: "admin" | "member") => Promise<void>;
  loading: boolean;
}

export function AddUserForm({
  availableUsers,
  onAddUser,
  loading,
}: AddUserFormProps) {
  const [selectedUsername, setSelectedUsername] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUsername) return;

    await onAddUser(selectedUsername, role);
    setSelectedUsername("");
    setRole("member");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Add User to Organization
        </CardTitle>
        <CardDescription>
          Add an existing user to this organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username">Select User</Label>
            <Select
              value={selectedUsername}
              onValueChange={(value) => setSelectedUsername(value)}
              disabled={loading}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No users available
                  </div>
                ) : (
                  availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.username}>
                      {user.username}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Select
              value={role}
              onValueChange={(value: "admin" | "member") => setRole(value)}
              disabled={loading}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || availableUsers.length === 0}
          >
            {loading ? "Adding..." : "Add User"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
