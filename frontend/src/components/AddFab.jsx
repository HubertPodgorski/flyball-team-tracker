import React from "react";
import { Fab } from "@mui/material";
import { useTranslation } from "react-i18next";
import AddIcon from "@mui/icons-material/Add";
import { BOTTOM_NAV_HEIGHT } from "./BottomNavBar";

const FAB_HEIGHT = 56;
const FAB_GAP = 8;

// Content bottom margin to clear the fab: gap above it + its own height.
export const FAB_CONTENT_CLEARANCE = 16 + FAB_HEIGHT;

const AddFab = ({ onClick, disabled }) => {
  const { t } = useTranslation();

  return (
    <Fab
      color="primary"
      aria-label={t("common.add")}
      onClick={onClick}
      disabled={disabled}
      sx={{
        position: "fixed",
        bottom: `${BOTTOM_NAV_HEIGHT + FAB_GAP}px`,
        right: `${FAB_GAP}px`,
      }}
    >
      <AddIcon />
    </Fab>
  );
};

export default AddFab;
