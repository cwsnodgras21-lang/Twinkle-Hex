"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface AdminLayoutContextValue {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const AdminLayoutContext = createContext<AdminLayoutContextValue | null>(null);

export function AdminLayoutProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <AdminLayoutContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      {children}
    </AdminLayoutContext.Provider>
  );
}

export function useAdminLayout() {
  const ctx = useContext(AdminLayoutContext);
  return ctx ?? { sidebarOpen: false, setSidebarOpen: () => {} };
}
