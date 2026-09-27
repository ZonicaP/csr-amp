"use client";

import { create } from "zustand";
import type { UserListItem } from "@/lib/users/user-list";

export type CustomersPage = {
  users: UserListItem[];
  page: number;
  pageSize: number;
  total: number;
  approximate?: boolean;
};

const MAX_CACHED_PAGES = 8;

export function customersCacheKey(query: string, page: number, onCallOnly = false) {
  return `${query}\n${page}\n${onCallOnly ? "call" : "all"}`;
}

type CustomersStore = {
  query: string;
  onCallOnly: boolean;
  page: number;
  pages: Record<string, CustomersPage>;
  recent: string[];
  setQuery: (query: string) => void;
  setOnCallOnly: (onCallOnly: boolean) => void;
  setPage: (page: number) => void;
  remember: (query: string, page: number, onCallOnly: boolean, data: CustomersPage) => void;
};

export const useCustomersStore = create<CustomersStore>((set) => ({
  query: "",
  onCallOnly: false,
  page: 1,
  pages: {},
  recent: [],
  setQuery: (query) => set({ query }),
  setOnCallOnly: (onCallOnly) => set({ onCallOnly, page: 1 }),
  setPage: (page) => set({ page }),
  remember: (query, page, onCallOnly, data) =>
    set((state) => {
      const key = customersCacheKey(query, page, onCallOnly);
      const recent = [key, ...state.recent.filter((item) => item !== key)].slice(0, MAX_CACHED_PAGES);
      const pages: Record<string, CustomersPage> = { ...state.pages, [key]: data };
      for (const existing of Object.keys(pages)) {
        if (!recent.includes(existing)) delete pages[existing];
      }
      return { pages, recent };
    }),
}));
