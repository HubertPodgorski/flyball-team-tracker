import React from "react";
import { ListItemButton, ListItemText, styled } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useAuthContext } from "../hooks/useAuthContext";
import { useNavigate } from "@tanstack/react-router";
import { notAuthenticatedRoutes } from "../helpers/routesAndPaths";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";

const MenuListItemStyled = styled(ListItemButton)(({ theme }) => ({
  textAlign: "left",
  "& .MuiSvgIcon-root": {
    marginRight: theme.spacing(1),
  },
}));

const LoginLogoutListButton = () => {
  const navigate = useNavigate();
  const { logout } = useAuthContext();
  const { t } = useTranslation();

  return (
    <MenuListItemStyled
      onClick={() => {
        logout();
        navigate({ to: notAuthenticatedRoutes.login });
      }}
    >
      <LogoutRoundedIcon /> <ListItemText primary={t("nav.logout")} />
    </MenuListItemStyled>
  );
};

export default LoginLogoutListButton;
