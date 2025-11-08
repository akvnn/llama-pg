import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import type { ServiceAccount } from "@/types/user.types";

interface ServiceAccountsTableProps {
  serviceAccounts: ServiceAccount[];
  loading: boolean;
  currentOrganization?: string | null;
}

export function ServiceAccountsTable({
  serviceAccounts,
  loading,
  currentOrganization,
}: ServiceAccountsTableProps) {
  return (
    <Card className="overflow-y-auto md:h-72 sm:h-64">
      <CardHeader>
        <CardTitle>Service Accounts</CardTitle>
        {currentOrganization && (
          <p className="text-sm text-muted-foreground">
            For current organization
          </p>
        )}
      </CardHeader>
      <CardContent>
        {!currentOrganization ? (
          <div className="text-center py-8 text-muted-foreground">
            Select an organization to view service accounts
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : serviceAccounts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No service accounts found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceAccounts.map((sa) => (
                <TableRow key={sa.user_id}>
                  <TableCell className="font-medium">{sa.username}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        sa.role === "owner"
                          ? "default"
                          : sa.role === "admin"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {sa.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(sa.joined_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
