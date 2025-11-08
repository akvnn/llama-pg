import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import type { OrganizationUser } from "@/types/org.types";

interface OrganizationUsersTableProps {
  users: OrganizationUser[];
  loading: boolean;
  onRemoveUser: (username: string) => Promise<void>;
  removeUserLoading: string | null;
}

export function OrganizationUsersTable({
  users,
  loading,
  onRemoveUser,
  removeUserLoading,
}: OrganizationUsersTableProps) {
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-chart-4/10 text-chart-4";
      case "admin":
        return "bg-chart-1/10 text-chart-1";
      case "member":
        return "bg-muted text-muted-foreground";
      default:
        return "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Users</CardTitle>
        <CardDescription>
          {loading
            ? "Loading users..."
            : `${users.length} user${users.length !== 1 ? "s" : ""} in this organization`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-12 bg-muted animate-pulse rounded"
              />
            ))}
          </div>
        ) : users.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No users found in this organization
          </p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell className="font-medium">
                      {user.username}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getRoleBadgeColor(user.role)}
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {user.role !== "owner" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveUser(user.username)}
                          disabled={removeUserLoading === user.username}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
