import { create } from "zustand";

interface OrganizationStore {
  currentOrganization: string | null;
  setCurrentOrganization: (org: string | null) => void;
}

export const useOrganizationStore = create<OrganizationStore>((set) => ({
  currentOrganization: null,
  setCurrentOrganization: (org: string | null) =>
    set({ currentOrganization: org }),
}));
