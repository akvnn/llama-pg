import { z } from "zod";

export const projectSchema = z.object({
  project_id: z.string(),
  project_name: z.string(),
  number_of_documents: z.number(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  description: z.string().nullable(),
});

export type Project = z.infer<typeof projectSchema>;
