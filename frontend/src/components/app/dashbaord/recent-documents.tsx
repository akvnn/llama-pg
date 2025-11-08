import { DocumentsTable } from "../documents-table/documents-table";
import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/axios";
import { useOrganizationStore } from "@/hooks/use-organization";
import type { Document } from "@/types/document.types";
import type { PaginationResponse } from "@/types/api.types";

export default function RecentDocuments() {
  const currentOrganization = useOrganizationStore(
    (state) => state.currentOrganization
  );
  const [data, setData] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    if (!currentOrganization) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.get<PaginationResponse<Document>>(
        "/recent_documents_info",
        {
          params: {
            page: 1,
            per_page: 10,
            organization_id: currentOrganization,
          },
        }
      );
      setData(response.data.items);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return (
    <div className="flex flex-col py-4 px-4 md:px-6 gap-6 animate-in fade-in-0 slide-in-from-left-10 zoom-in-100 duration-300 transition">
      <h1 className="text-2xl font-semibold">Recent Documents</h1>
      <DocumentsTable data={data} loading={loading} limit={10} onRefresh={fetchDocuments} />
    </div>
  );
}
