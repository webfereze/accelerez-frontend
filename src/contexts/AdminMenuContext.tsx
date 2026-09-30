import React, { createContext, useContext, useMemo, useState } from "react";

type AdminMenuValue = {
  /** Desktop: sidebar narrowed to icons only. */
  collapsed: boolean;
  toggleCollapsed: () => void;
  /** Mobile: the sidebar drawer is open. */
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
};

const AdminMenuContext = createContext<AdminMenuValue | null>(null);

export function AdminMenuProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const value = useMemo<AdminMenuValue>(
    () => ({
      collapsed,
      toggleCollapsed: () => setCollapsed((c) => !c),
      mobileOpen,
      setMobileOpen,
    }),
    [collapsed, mobileOpen],
  );

  return <AdminMenuContext.Provider value={value}>{children}</AdminMenuContext.Provider>;
}

export function useAdminMenu(): AdminMenuValue {
  const context = useContext(AdminMenuContext);
  if (!context) throw new Error("useAdminMenu must be used inside AdminMenuProvider");
  return context;
}
