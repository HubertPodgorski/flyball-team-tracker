import React from "react";
import {
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  styled,
  Toolbar,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import PetsIcon from "@mui/icons-material/Pets";
import PersonIcon from "@mui/icons-material/Person";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import TextSnippetIcon from "@mui/icons-material/TextSnippet";
import GroupsIcon from "@mui/icons-material/Groups";

import { Link, useLocation } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { trainerRoutes, userRoutes } from "../helpers/routesAndPaths";
import LoginLogoutListButton from "./LoginLogoutListButton";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import { useIsTrainer } from "../hooks/useIsTrainer";
import { useIsSuperAdmin } from "../hooks/useIsSuperAdmin";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import SettingsIcon from "@mui/icons-material/Settings";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const drawerWidth = 240;

const MenuListItemStyled = styled(ListItemButton)(({ theme }) => ({
  textAlign: "left",
  "& .MuiSvgIcon-root": {
    marginRight: theme.spacing(1),
  },
}));

// Fixed height regardless of viewport, so AddFab can sit a known gap above it.
export const BOTTOM_NAV_HEIGHT = 56;

// component={Link} (not onClick + navigate()) so hovering/focusing the item
// triggers the router's intent-preload (see router.ts's defaultPreload).
const NavListItem = ({ to, icon, label }) => {
  const { pathname } = useLocation();

  return (
    <MenuListItemStyled component={Link} to={to} selected={pathname === to}>
      {icon} <ListItemText primary={label} />
    </MenuListItemStyled>
  );
};

const UserTabBar = () => {
  const { pathname } = useLocation();
  const { t } = useTranslation();

  // Every logged-in user's own nav (not gated by role) - lives in the bottom
  // tab row now, not the drawer. Trainer/super-admin sections stay drawer-only.
  const userTabs = [
    { to: userRoutes.tasks, icon: <FormatListNumberedIcon />, label: t("nav.tasks") },
    { to: userRoutes.calendar, icon: <CalendarMonthIcon />, label: t("nav.calendar") },
    { to: userRoutes.myDogs, icon: <PetsIcon />, label: t("nav.myDogs") },
    { to: userRoutes.teams, icon: <GroupsIcon />, label: t("nav.teams") },
  ];

  return (
    <BottomNavigation
      value={pathname}
      showLabels
      sx={{ flexGrow: 1, backgroundColor: "transparent" }}
    >
      {userTabs.map(({ to, icon, label }) => (
        <BottomNavigationAction
          key={to}
          component={Link}
          to={to}
          value={to}
          icon={icon}
          label={label}
        />
      ))}
    </BottomNavigation>
  );
};

const BottomNavBar = () => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { t } = useTranslation();

  const onDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const isTrainer = useIsTrainer();
  const isSuperAdmin = useIsSuperAdmin();

  const drawer = (
    <Box onClick={onDrawerToggle} sx={{ textAlign: "center" }}>
      <List>
        {isTrainer && (
          <>
            <MenuListItemStyled>{t("nav.trainerSection")}</MenuListItemStyled>

            <NavListItem
              to={trainerRoutes.tasks}
              icon={<FormatListBulletedIcon />}
              label={t("nav.tasks")}
            />
            <NavListItem
              to={trainerRoutes.dogs}
              icon={<PetsIcon />}
              label={t("nav.dogs")}
            />
            <NavListItem
              to={trainerRoutes.dogTasks}
              icon={<TextSnippetIcon />}
              label={t("nav.dogTasks")}
            />
            <NavListItem
              to={trainerRoutes.events}
              icon={<CalendarMonthIcon />}
              label={t("nav.events")}
            />
            <NavListItem
              to={trainerRoutes.users}
              icon={<PersonIcon />}
              label={t("nav.users")}
            />
            <NavListItem
              to={trainerRoutes.teams}
              icon={<GroupsIcon />}
              label={t("nav.teams")}
            />
          </>
        )}

        {isSuperAdmin && (
          <>
            {isTrainer && <Divider />}

            <MenuListItemStyled>{t("nav.superAdminSection")}</MenuListItemStyled>

            <NavListItem
              to="/club-switch"
              icon={<SwapHorizIcon />}
              label={t("nav.clubSwitch")}
            />
            <NavListItem
              to="/super-admin/users"
              icon={<PersonIcon />}
              label={t("nav.allUsers")}
            />
            <NavListItem
              to="/super-admin/dogs"
              icon={<PetsIcon />}
              label={t("nav.allDogs")}
            />
            <NavListItem
              to="/super-admin/dog-tasks"
              icon={<TextSnippetIcon />}
              label={t("nav.allDogTasks")}
            />
            <NavListItem
              to="/super-admin/events"
              icon={<CalendarMonthIcon />}
              label={t("nav.allEvents")}
            />
            <NavListItem
              to="/super-admin/teams"
              icon={<GroupsIcon />}
              label={t("nav.allTeams")}
            />
          </>
        )}

        <Divider />

        <NavListItem
          to={userRoutes.settings}
          icon={<SettingsIcon />}
          label={t("nav.settings")}
        />

        <NavListItem
          to={userRoutes.about}
          icon={<InfoOutlinedIcon />}
          label={t("about.navLabel")}
        />

        <LoginLogoutListButton />
      </List>
    </Box>
  );

  const container =
    window !== undefined ? () => window.document.body : undefined;

  return (
    <AppBar
      position="fixed"
      sx={{
        top: "auto",
        bottom: 0,
        backgroundColor: (theme) => theme.palette.background.paper,
      }}
    >
      <Box component="nav">
        <Drawer
          anchor="right"
          container={container}
          variant="temporary"
          open={mobileOpen}
          onClose={onDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Toolbar
        disableGutters
        sx={{
          backgroundColor: (theme) => theme.palette.background.paper,
          // MUI overrides minHeight again at this breakpoint - restate it.
          minHeight: `${BOTTOM_NAV_HEIGHT}px`,
          "@media (min-width:600px)": {
            minHeight: `${BOTTOM_NAV_HEIGHT}px`,
          },
        }}
      >
        <UserTabBar />

        <IconButton
          color="inherit"
          aria-label={t("nav.openDrawer")}
          sx={{ marginRight: 1 }}
          onClick={onDrawerToggle}
        >
          <MenuIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default BottomNavBar;
