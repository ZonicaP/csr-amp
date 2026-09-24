"use client";

import { create } from "zustand";
import type { UserListItem } from "@/lib/users/user-list";

export type CustomersPage = {
  users: UserListItem[];
  page: number;
  pageSize: number;
  total: number;
};

const MAX_CACHED_PAGES = 8;

export function customersCacheKey(query: string, page: number) {
  return `${query}\n${page}`;
}

type CustomersStore = {
  query: string;
  page: number;
  pages: Record<string, CustomersPage>;
  recent: string[];
  setQuery: (query: string) => void;
  setPage: (page: number) => void;
  remember: (query: string, page: number, data: CustomersPage) => void;
};

export const useCustomersStore = create<CustomersStore>((set) => ({
  query: "",
  page: 1,
  pages: {},
  recent: [],
  setQuery: (query) => set({ query }),
  setPage: (page) => set({ page }),
  remember: (query, page, data) =>
    set((state) => {
      const key = customersCacheKey(query, page);
      const recent = [key, ...state.recent.filter((item) => item !== key)].slice(0, MAX_CACHED_PAGES);
      const pages: Record<string, CustomersPage> = { ...state.pages, [key]: data };
      for (const existing of Object.keys(pages)) {
        if (!recent.includes(existing)) delete pages[existing];
      }
      return { pages, recent };
    }),
}));
