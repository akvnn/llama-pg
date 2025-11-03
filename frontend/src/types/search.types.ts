export interface SearchResult {
  id: string;
  title: string;
  metadata: Record<string, any>;
  text: string;
  project_id: string;
  chunk: number;
  distance: number;
}
