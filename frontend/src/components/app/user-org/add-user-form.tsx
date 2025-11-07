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
import { Input } from "@/components/ui/input";

interface AddUserFormProps {
  onAddUser: (username: string, role: "admin" | "member") => Promise<void>;
  loading: boolean;
}

export function AddUserForm({ onAddUser, loading }: AddUserFormProps) {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;

    await onAddUser(username, role);
    setUsername("");
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
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="mt-1"
              disabled={loading}
            />
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
            disabled={loading || username.length === 0}
          >
            {loading ? "Adding..." : "Add User"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
