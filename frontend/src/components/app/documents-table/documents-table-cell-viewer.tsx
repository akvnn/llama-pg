import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
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
import type { schema } from "./documents-table";
import { Button } from "../../ui/button";
import { useEffect, useState } from "react";
import axiosInstance from "@/axios";
import { Loader2 } from "lucide-react";

interface DocumentDetail {
  document_name: string;
  document_type: string;
  metadata: Record<string, unknown>;
  document_status: string;
  document_id: string;
  created_at: string;
  updated_at: string | null;
  parsed_markdown_text: string | null;
  file_bytes: string;
  summary: string | null;
  uploaded_by_user_id: string;
}

function getContentType(fileExtension: string): string {
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    txt: "text/plain",
    md: "text/markdown",
    html: "text/html",
    json: "application/json",
    xml: "application/xml",
  };
  return mimeTypes[fileExtension.toLowerCase()] || "application/octet-stream";
}

function base64ToBlob(base64: string, fileExtension: string = ""): string {
  const byteCharacters = atob(base64);

  const byteNumbers = new Uint8Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const contentType = getContentType(fileExtension);
  const blob = new Blob([byteNumbers], { type: contentType });
  return URL.createObjectURL(blob);
}

export function DocumentsTableCellViewer({
  item,
}: {
  item: z.infer<typeof schema>;
}) {
  const isMobile = useIsMobile();
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      if (documentUrl) {
        URL.revokeObjectURL(documentUrl);
        setDocumentUrl(null);
      }
      return;
    }

    const fetchDocument = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axiosInstance.get<DocumentDetail>("/document", {
          params: {
            document_id: item.document_id,
            project_id: item.project_id,
            organization_id: item.organization_id,
          },
        });

        const { file_bytes, document_type } = response.data;

        console.log("Fetched document details:", response.data);

        const blobUrl = base64ToBlob(file_bytes, document_type);

        setDocumentUrl(blobUrl);
      } catch (err: any) {
        console.error("Error fetching document:", err);
        setError(err.response?.data?.detail || "Failed to load document");
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();

    return () => {
      if (documentUrl) {
        URL.revokeObjectURL(documentUrl);
      }
    };
  }, [isOpen, item.document_id, item.project_id, item.organization_id]);

  return (
    <Drawer
      handleOnly
      direction={isMobile ? "bottom" : "right"}
      onOpenChange={setIsOpen}
    >
      <DrawerTrigger asChild>
        <Button
          variant="link"
          className="text-foreground w-fit px-0 text-left cursor-pointer"
        >
          {item.document_uploaded_name}
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
              <DrawerTitle className="text-2xl text-black">
                {item.document_uploaded_name.split(".")[0]}
              </DrawerTitle>
              <DrawerDescription className="text-muted-foreground">
                Project: {item.project_name} | Status: {item.status}
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex-1 h-5/6 p-4">
              {loading && (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">
                    Loading document...
                  </span>
                </div>
              )}
              {error && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-red-500 font-semibold">
                      Error loading document
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {error}
                    </p>
                  </div>
                </div>
              )}
              {!loading && !error && documentUrl && (
                <iframe
                  src={documentUrl}
                  className="w-full h-full border-0 rounded-lg"
                  title={item.document_uploaded_name}
                />
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </DrawerContent>
    </Drawer>
  );
}
