import type { LucideIcon } from "lucide-react";

export interface StatInfo {
  total_count: number;
  projects_count: number;
  status_counts: Record<string, number>;
}

export interface Cards {
  title: string;
  badge: LucideIcon;
}
