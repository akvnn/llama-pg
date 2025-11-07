import { z } from "zod";

export const documentSchema = z.object({
  document_id: z.string(),
  document_uploaded_name: z.string(),
  metadata: z.record(z.unknown()),
  status: z.string(),
  uploaded_by_user_name: z.string(),
  created_at: z.string(),
  project_id: z.string(),
  project_name: z.string(),
  organization_id: z.string(),
});

export type Document = z.infer<typeof documentSchema>;

export interface DocumentDetail {
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
