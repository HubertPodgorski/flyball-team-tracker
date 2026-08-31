import React, { useEffect } from "react";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useAuthContext } from "../../hooks/useAuthContext";
import { useIsTrainer } from "../../hooks/useIsTrainer";

const TrainerPanelLayout = () => {
  const { user } = useAuthContext();
  const isTrainer = useIsTrainer();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !isTrainer) {
      navigate({ to: "/login" });
    }
  }, [user, isTrainer, navigate]);

  if (!user || !isTrainer) return null;

  return <Outlet />;
};

export const Route = createFileRoute("/trainer-panel")({
  component: TrainerPanelLayout,
});
