import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function TableSkeleton() {
  return (
    <div className="mx-4 sm:mx-6 border rounded-xl overflow-hidden">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead className="w-[150px]">
              <Skeleton className="h-5 w-[150px]" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-5 w-[150px]" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-5 w-[150px]" />
            </TableHead>
            <TableHead className="text-right">
              <Skeleton className="h-5 w-[150px]" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>
              <Skeleton className="h-5 w-[150px]" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-[150px]" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-[150px]" />
            </TableCell>
            <TableCell className="text-right">
              <Skeleton className="h-5 w-[150px]" />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <Skeleton className="h-5 w-[150px]" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-[150px]" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-[150px]" />
            </TableCell>
            <TableCell className="text-right">
              <Skeleton className="h-5 w-[150px]" />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <Skeleton className="h-5 w-[150px]" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-[150px]" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-[150px]" />
            </TableCell>
            <TableCell className="text-right">
              <Skeleton className="h-5 w-[150px]" />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <Skeleton className="h-5 w-[150px]" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-[150px]" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-[150px]" />
            </TableCell>
            <TableCell className="text-right">
              <Skeleton className="h-5 w-[150px]" />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <Skeleton className="h-5 w-[150px]" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-[150px]" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-[150px]" />
            </TableCell>
            <TableCell className="text-right">
              <Skeleton className="h-5 w-[150px]" />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
