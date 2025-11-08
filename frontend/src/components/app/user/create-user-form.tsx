import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Bot, Loader2 } from "lucide-react";

interface CreateUserFormProps {
  onSubmit: (username: string, password: string, confirmPassword: string) => Promise<void>;
  creating: boolean;
  error: string;
  success: string;
  isServiceAccount?: boolean;
  currentOrganization?: string | null;
}

export function CreateUserForm({
  onSubmit,
  creating,
  error,
  success,
  isServiceAccount = false,
  currentOrganization,
}: CreateUserFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(username, password, confirmPassword);
    // Reset form on success
    if (success) {
      setUsername("");
      setPassword("");
      setConfirmPassword("");
    }
  };

  const Icon = isServiceAccount ? Bot : UserPlus;
  const title = isServiceAccount ? "Create Service Account" : "Create Regular User";

  if (isServiceAccount && !currentOrganization) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-chart-5 bg-chart-5/10 p-3 rounded-md">
            Please select an organization from the sidebar to create service
            accounts
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={isServiceAccount ? "sa-username" : "username"}>
              Username
            </Label>
            <Input
              id={isServiceAccount ? "sa-username" : "username"}
              type="text"
              placeholder={
                isServiceAccount
                  ? "Enter service account username"
                  : "Enter username"
              }
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={creating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={isServiceAccount ? "sa-password" : "password"}>
              Password
            </Label>
            <Input
              id={isServiceAccount ? "sa-password" : "password"}
              type="password"
              placeholder="Enter password (min. 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={creating}
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor={
                isServiceAccount ? "sa-confirmPassword" : "confirmPassword"
              }
            >
              Confirm Password
            </Label>
            <Input
              id={isServiceAccount ? "sa-confirmPassword" : "confirmPassword"}
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={creating}
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm text-chart-3 bg-chart-3/10 p-3 rounded-md">
              {success}
            </div>
          )}

          <Button type="submit" disabled={creating} className="w-full">
            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isServiceAccount ? "Create Service Account" : "Create User"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
