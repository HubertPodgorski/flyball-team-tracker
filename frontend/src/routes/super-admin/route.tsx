import React, { useEffect } from "react";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useAuthContext } from "../../hooks/useAuthContext";
import { useIsSuperAdmin } from "../../hooks/useIsSuperAdmin";

const SuperAdminLayout = () => {
  const { user } = useAuthContext();
  const isSuperAdmin = useIsSuperAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !isSuperAdmin) {
      navigate({ to: "/login" });
    }
  }, [user, isSuperAdmin, navigate]);

  if (!user || !isSuperAdmin) return null;

  return <Outlet />;
};

export const Route = createFileRoute("/super-admin")({
  component: SuperAdminLayout,
});
