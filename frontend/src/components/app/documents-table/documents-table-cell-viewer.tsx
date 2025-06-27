import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { z } from "zod";
import type { schema } from "../dashbaord/documents-table";
import { Button } from "../../ui/button";

export function DocumentsTableCellViewer({
  item,
}: {
  item: z.infer<typeof schema>;
}) {
  const isMobile = useIsMobile();

  return (
    <Drawer handleOnly direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button
          variant="link"
          className="text-foreground w-fit px-0 text-left cursor-pointer"
        >
          {item.title}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="md:min-w-2/3 bg-transparent border-none">
        <ResizablePanelGroup
          direction="horizontal"
          className="min-h-full min-w-full md:min-w-4/5 overflow-y-auto"
        >
          <ResizablePanel className="max-w-[60%] hidden md:block">
            <DrawerClose asChild className="w-full h-full">
              <Button variant="ghost" className="hover:bg-transparent" />
            </DrawerClose>
          </ResizablePanel>
          <ResizableHandle withHandle className="hidden md:flex" />
          <ResizablePanel className="bg-white min-w-full md:min-w-[70%] lg:min-w-[40%] !overflow-y-auto">
            <DrawerHeader className="gap-1">
              <DrawerTitle className="text-2xl">
                {item.title.split(".")[0]}
              </DrawerTitle>
              <DrawerDescription>
                Style this the way you want zain. (brief text)
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex-1 h-5/6 p-4">
              {
                <iframe
                  src={"sample-report.pdf"}
                  className="w-full h-full border-0 rounded-lg"
                  title={item.title}
                />
              }
            </div>
            <DrawerFooter className="flex flex-row gap-3 flex-wrap">
              {/** TODO: Make buttons fixed size */}
              <Button className="grow">Submit</Button>
              <DrawerClose asChild className="grow">
                <Button variant="outline">Done</Button>
              </DrawerClose>
            </DrawerFooter>
          </ResizablePanel>
        </ResizablePanelGroup>
      </DrawerContent>
    </Drawer>
  );
}
