import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardCardsSkeleton() {
  return (
    <div className="*:data-[slot=card]:bg-none *:data-[slot=card]:border-none  *:data-[slot=card]:p-0 *:data-[slot=card]:shadow-none  *:data-[slot=card]:outline-none *:data-[slot=card]: grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <Card key={index} className="flex flex-col space-y-[0.5]">
          <Skeleton className="h-[87.6px] w-[100%] rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[100%]" />
            <Skeleton className="h-4 w-[95%]" />
          </div>
        </Card>
      ))}
      <Card className="flex flex-col space-y-[0.5] col-span-full col-start-2">
        <Skeleton className="h-[87.6px] w-[100%] rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[100%]" />
          <Skeleton className="h-4 w-[95%]" />
        </div>
      </Card>
    </div>
  );
}
