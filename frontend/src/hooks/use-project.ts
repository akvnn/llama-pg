import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ProjectStore {
  currentProject: string | null;
  setCurrentProject: (projectId: string | null) => void;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      currentProject: null,
      setCurrentProject: (projectId) => set({ currentProject: projectId }),
    }),
    {
      name: "project-storage",
    }
  )
);
