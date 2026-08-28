import React, { useEffect } from "react";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useAuthContext } from "../../hooks/useAuthContext";
import { useIsAdmin } from "../../hooks/useIsAdmin";

const AdminPanelLayout = () => {
  const { user } = useAuthContext();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !isAdmin) {
      navigate({ to: "/login" });
    }
  }, [user, isAdmin, navigate]);

  if (!user || !isAdmin) return null;

  return <Outlet />;
};

export const Route = createFileRoute("/admin-panel")({
  component: AdminPanelLayout,
});
