import type { LucideIcon } from "lucide-react";

export interface StatInfo {
  queued_count: number;
  parsed_count: number;
  embedded_count: number;
}

export interface Cards {
  title: string;
  badge: LucideIcon;
}
