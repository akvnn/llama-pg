import { DocumentsTable } from "./documents-table";

export default function RecentDocuments() {
  return (
    <div className="flex flex-col py-4 px-4 md:px-6 gap-6 animate-in fade-in-0 slide-in-from-left-10 zoom-in-100 duration-300 transition">
      <h1 className="text-2xl font-semibold">Recent Documents</h1>
      <DocumentsTable limit={10} />
    </div>
  );
}
