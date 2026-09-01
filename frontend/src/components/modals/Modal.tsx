import React, { ReactNode } from "react";
import { Dialog, DialogContent, DialogTitle, styled, useTheme } from "@mui/material";

interface Props {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
}

const DialogTitleStyled = styled(DialogTitle)({
  padding: "8px",
});

const DialogContentStyled = styled(DialogContent)(({ theme }) => ({
  minWidth: 400,
  maxWidth: 600,
  [theme.breakpoints.down("md")]: {
    minWidth: 300,
    padding: theme.spacing(1),
  },
}));

const Modal = ({ open, onClose, children, title }: Props) => {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={{
        [theme.breakpoints.down("md")]: {
          ".MuiDialog-paper": {
            margin: theme.spacing(1),
            width: "100%",
          },
        },
      }}
    >
      <DialogTitleStyled>{title}</DialogTitleStyled>

      <DialogContentStyled>{children}</DialogContentStyled>
    </Dialog>
  );
};

export default Modal;
