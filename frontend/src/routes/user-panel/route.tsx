import React, { useEffect } from "react";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useAuthContext } from "../../hooks/useAuthContext";

const UserPanelLayout = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate({ to: "/login" });
    }
  }, [user, navigate]);

  if (!user) return null;

  return <Outlet />;
};

export const Route = createFileRoute("/user-panel")({
  component: UserPanelLayout,
});
