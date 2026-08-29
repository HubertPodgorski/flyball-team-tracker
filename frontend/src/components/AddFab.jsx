import React from "react";
import { Fab } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

// Default MUI Fab size + clearance top and bottom - reserve this much
// bottom space in a view's content so the floating button never covers it.
const FAB_HEIGHT = 56;
export const FAB_CONTENT_CLEARANCE = FAB_HEIGHT + 8 + 8;

const AddFab = ({ onClick, disabled }) => (
  <Fab
    color="primary"
    aria-label="Add"
    onClick={onClick}
    disabled={disabled}
    sx={{
      position: "fixed",
      bottom: (theme) => theme.spacing(10),
      right: (theme) => theme.spacing(2),
    }}
  >
    <AddIcon />
  </Fab>
);

export default AddFab;
