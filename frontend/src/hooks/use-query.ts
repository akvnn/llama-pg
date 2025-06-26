import { use } from "react";

const promiseCache = new Map<string, Promise<unknown>>();
export function useQuery<T = unknown>({
  fn,
  key,
}: {
  fn: () => Promise<unknown>;
  key: string;
}) {
  if (!promiseCache.has(key)) promiseCache.set(key, fn());

  const promise = promiseCache.get(key) as Promise<T>;
  const result = use(promise);

  return result;
}
