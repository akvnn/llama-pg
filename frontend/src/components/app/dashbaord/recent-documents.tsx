import { useQuery } from "@/hooks/use-query";
import { DocumentsTable, schema } from "./documents-table";
import axiosInstance from "@/axios";
import type { z } from "zod";

export default function RecentDocuments() {
  const data = useQuery<z.infer<typeof schema>[]>({
    fn: () =>
      axiosInstance
        .get("https://jsonplaceholder.typicode.com/comments/")
        .then((res) => res.data)
        .catch(() => {}),
    key: "documents",
  });
  return (
    <div className="flex flex-col py-4 px-4 md:px-6 gap-6 animate-in fade-in-0 slide-in-from-left-10 zoom-in-100 duration-300 transition">
      <h1 className="text-2xl font-semibold">Recent Documents</h1>
      <DocumentsTable
        data={[
          {
            id: 1,
            title: "sample-report.pdf",
            project: "cars",
            status: "embedded",
            size: "12 MB",
          },
        ]}
      />
    </div>
  );
}
