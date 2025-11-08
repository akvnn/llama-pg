import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleDateString("en-UK", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}
