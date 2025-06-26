import { ProjectsTable, schema } from "./projects-table";
import type { z } from "zod";
import { useQuery } from "@/hooks/use-query";
import axiosInstance from "@/axios";

export default function Projects() {
  const data = useQuery<z.infer<typeof schema>[]>({
    fn: () =>
      axiosInstance
        .get("https://jsonplaceholder.typicode.com/comments/")
        .then((res) => res.data)
        .catch(() => {}),
    key: "projects",
  });
  return (
    <div className="flex flex-col py-4 px-4 md:px-6 gap-6  animate-in fade-in-0 slide-in-from-left-10 zoom-in-100 duration-300 transition">
      <h1 className="text-2xl font-semibold">Projects</h1>
      <ProjectsTable data={[]} />
    </div>
  );
}
