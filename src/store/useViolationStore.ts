import { create } from "zustand";
import { Violation, ViolationFilters } from "@/types";

interface ViolationStore {
  violations: Violation[];
  filters: ViolationFilters;
  selectedViolation: Violation | null;
  isModalOpen: boolean;
  setViolations: (violations: Violation[]) => void;
  addViolation: (violation: Violation) => void;
  updateViolation: (id: string, violation: Partial<Violation>) => void;
  deleteViolation: (id: string) => void;
  setFilters: (filters: ViolationFilters) => void;
  setSelectedViolation: (violation: Violation | null) => void;
  setIsModalOpen: (isOpen: boolean) => void;
  getFilteredViolations: () => Violation[];
}

export const useViolationStore = create<ViolationStore>((set, get) => ({
  violations: [],
  filters: {},
  selectedViolation: null,
  isModalOpen: false,

  setViolations: (violations) => set({ violations }),

  addViolation: (violation) =>
    set((state) => ({
      violations: [violation, ...state.violations],
    })),

  updateViolation: (id, updatedViolation) =>
    set((state) => ({
      violations: state.violations.map((v) =>
        v.id === id ? { ...v, ...updatedViolation, updatedAt: new Date().toISOString() } : v
      ),
    })),

  deleteViolation: (id) =>
    set((state) => ({
      violations: state.violations.filter((v) => v.id !== id),
    })),

  setFilters: (filters) => set({ filters }),

  setSelectedViolation: (violation) => set({ selectedViolation: violation }),

  setIsModalOpen: (isOpen) => set({ isModalOpen: isOpen }),

  getFilteredViolations: () => {
    const { violations, filters } = get();
    let filtered = [...violations];

    if (filters.status) {
      filtered = filtered.filter((v) => v.status === filters.status);
    }

    if (filters.type) {
      filtered = filtered.filter((v) => v.type === filters.type);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.vehiclePlate.toLowerCase().includes(search) ||
          v.location.toLowerCase().includes(search) ||
          v.description.toLowerCase().includes(search) ||
          v.reporterName.toLowerCase().includes(search)
      );
    }

    if (filters.dateFrom) {
      filtered = filtered.filter((v) => new Date(v.dateTime) >= new Date(filters.dateFrom!));
    }

    if (filters.dateTo) {
      filtered = filtered.filter((v) => new Date(v.dateTime) <= new Date(filters.dateTo!));
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
}));
