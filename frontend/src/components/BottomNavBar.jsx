import React from "react";
import {
  AppBar,
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

import { useLocation, useNavigate } from "@tanstack/react-router";
import { trainerRoutes, userRoutes } from "../helpers/routesAndPaths";
import LoginLogoutListButton from "./LoginLogoutListButton";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import { useIsTrainer } from "../hooks/useIsTrainer";
import { useIsSuperAdmin } from "../hooks/useIsSuperAdmin";
import SaveIcon from "@mui/icons-material/Save";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";

const drawerWidth = 240;

const MenuListItemStyled = styled(ListItemButton)(({ theme }) => ({
  textAlign: "left",
  "& .MuiSvgIcon-root": {
    marginRight: theme.spacing(1),
  },
}));

// Fixed height regardless of viewport, so AddFab can sit a known gap above it.
export const BOTTOM_NAV_HEIGHT = 56;

const NavListItem = ({ to, icon, label }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <MenuListItemStyled
      selected={pathname === to}
      onClick={() => navigate({ to })}
    >
      {icon} <ListItemText primary={label} />
    </MenuListItemStyled>
  );
};

const BottomNavBar = () => {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const onDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const isTrainer = useIsTrainer();
  const isSuperAdmin = useIsSuperAdmin();

  const drawer = (
    <Box onClick={onDrawerToggle} sx={{ textAlign: "center" }}>
      <List>
        {isTrainer && <MenuListItemStyled>User views</MenuListItemStyled>}

        <NavListItem
          to={userRoutes.tasks}
          icon={<FormatListNumberedIcon />}
          label="Tasks"
        />
        <NavListItem
          to={userRoutes.calendar}
          icon={<CalendarMonthIcon />}
          label="Calendar"
        />
        <NavListItem
          to={userRoutes.myDogs}
          icon={<PetsIcon />}
          label="My Dogs"
        />

        {isTrainer && (
          <>
            <Divider />

            <MenuListItemStyled>Trainer</MenuListItemStyled>

            <NavListItem
              to={trainerRoutes.tasks}
              icon={<FormatListBulletedIcon />}
              label="Tasks"
            />
            <NavListItem
              to={trainerRoutes.dogs}
              icon={<PetsIcon />}
              label="Dogs"
            />
            <NavListItem
              to={trainerRoutes.dogTasks}
              icon={<TextSnippetIcon />}
              label="Dog tasks"
            />
            <NavListItem
              to={trainerRoutes.events}
              icon={<CalendarMonthIcon />}
              label="Events"
            />
            <NavListItem
              to={trainerRoutes.eventTemplates}
              icon={<SaveIcon />}
              label="Event templates"
            />
            <NavListItem
              to={trainerRoutes.users}
              icon={<PersonIcon />}
              label="Users"
            />
          </>
        )}

        {isSuperAdmin && (
          <>
            <Divider />

            <MenuListItemStyled>Super Admin</MenuListItemStyled>

            <NavListItem
              to="/team-switch"
              icon={<SwapHorizIcon />}
              label="Team switch"
            />
            <NavListItem
              to="/super-admin/users"
              icon={<PersonIcon />}
              label="All users"
            />
            <NavListItem
              to="/super-admin/dogs"
              icon={<PetsIcon />}
              label="All dogs"
            />
            <NavListItem
              to="/super-admin/dog-tasks"
              icon={<TextSnippetIcon />}
              label="All dog tasks"
            />
            <NavListItem
              to="/super-admin/events"
              icon={<CalendarMonthIcon />}
              label="All events"
            />
            <NavListItem
              to="/super-admin/event-templates"
              icon={<SaveIcon />}
              label="All event templates"
            />
          </>
        )}

        <Divider />

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
        sx={{
          backgroundColor: (theme) => theme.palette.background.paper,
          // MUI overrides minHeight again at this breakpoint - restate it.
          minHeight: `${BOTTOM_NAV_HEIGHT}px`,
          "@media (min-width:600px)": {
            minHeight: `${BOTTOM_NAV_HEIGHT}px`,
          },
        }}
      >
        <Box sx={{ flexGrow: 1 }} />

        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onDrawerToggle}
        >
          <MenuIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default BottomNavBar;
