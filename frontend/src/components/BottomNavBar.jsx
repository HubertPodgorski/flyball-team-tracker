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
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import PetsIcon from "@mui/icons-material/Pets";
import PersonIcon from "@mui/icons-material/Person";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import TextSnippetIcon from "@mui/icons-material/TextSnippet";

import { useNavigate } from "@tanstack/react-router";
import { adminRoutes, userRoutes } from "../helpers/routesAndPaths";
import LoginLogoutListButton from "./LoginLogoutListButton";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import { useIsAdmin } from "../hooks/useIsAdmin";
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

const BottomNavBar = () => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const onDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const isAdmin = useIsAdmin();
  const isSuperAdmin = useIsSuperAdmin();

  const drawer = (
    <Box onClick={onDrawerToggle} sx={{ textAlign: "center" }}>
      <Typography variant="h6" sx={{ my: 1 }}>
        Go to
      </Typography>

      <Divider />

      <List>
        {isAdmin && <MenuListItemStyled>User views</MenuListItemStyled>}

        <MenuListItemStyled
          onClick={() => {
            navigate({ to: userRoutes.tasks });
          }}
        >
          <FormatListNumberedIcon /> <ListItemText primary="Tasks" />
        </MenuListItemStyled>

        <MenuListItemStyled
          onClick={() => {
            navigate({ to: userRoutes.calendar });
          }}
        >
          <CalendarMonthIcon /> <ListItemText primary="Calendar" />
        </MenuListItemStyled>

        <MenuListItemStyled
          onClick={() => {
            navigate({ to: userRoutes.myDogs });
          }}
        >
          <PetsIcon /> <ListItemText primary="My Dogs" />
        </MenuListItemStyled>

        {isAdmin && (
          <>
            <Divider />

            <MenuListItemStyled>Admin</MenuListItemStyled>

            <MenuListItemStyled
              onClick={() => {
                navigate({ to: adminRoutes.tasks });
              }}
            >
              <FormatListBulletedIcon />
              <ListItemText primary="Tasks" />
            </MenuListItemStyled>

            <MenuListItemStyled
              onClick={() => {
                navigate({ to: adminRoutes.dogs });
              }}
            >
              <PetsIcon />
              <ListItemText primary="Dogs" />
            </MenuListItemStyled>

            <MenuListItemStyled
              onClick={() => {
                navigate({ to: adminRoutes.dogTasks });
              }}
            >
              <TextSnippetIcon />
              <ListItemText primary="Dog tasks" />
            </MenuListItemStyled>

            <MenuListItemStyled
              onClick={() => {
                navigate({ to: adminRoutes.events });
              }}
            >
              <CalendarMonthIcon />
              <ListItemText primary="Events" />
            </MenuListItemStyled>

            <MenuListItemStyled
              onClick={() => {
                navigate({ to: adminRoutes.eventTemplates });
              }}
            >
              <SaveIcon />
              <ListItemText primary="Event templates" />
            </MenuListItemStyled>

            <MenuListItemStyled
              onClick={() => {
                navigate({ to: adminRoutes.users });
              }}
            >
              <PersonIcon />
              <ListItemText primary="Users" />
            </MenuListItemStyled>
          </>
        )}

        {isSuperAdmin && (
          <>
            <Divider />

            <MenuListItemStyled>Super Admin</MenuListItemStyled>

            <MenuListItemStyled
              onClick={() => {
                navigate({ to: "/team-switch" });
              }}
            >
              <SwapHorizIcon /> <ListItemText primary="Team switch" />
            </MenuListItemStyled>

            <MenuListItemStyled
              onClick={() => {
                navigate({ to: "/super-admin/users" });
              }}
            >
              <PersonIcon /> <ListItemText primary="All users" />
            </MenuListItemStyled>

            <MenuListItemStyled
              onClick={() => {
                navigate({ to: "/super-admin/dogs" });
              }}
            >
              <PetsIcon /> <ListItemText primary="All dogs" />
            </MenuListItemStyled>

            <MenuListItemStyled
              onClick={() => {
                navigate({ to: "/super-admin/dog-tasks" });
              }}
            >
              <TextSnippetIcon /> <ListItemText primary="All dog tasks" />
            </MenuListItemStyled>

            <MenuListItemStyled
              onClick={() => {
                navigate({ to: "/super-admin/events" });
              }}
            >
              <CalendarMonthIcon /> <ListItemText primary="All events" />
            </MenuListItemStyled>

            <MenuListItemStyled
              onClick={() => {
                navigate({ to: "/super-admin/event-templates" });
              }}
            >
              <SaveIcon /> <ListItemText primary="All event templates" />
            </MenuListItemStyled>
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
        sx={{ backgroundColor: (theme) => theme.palette.background.paper }}
      >
        <Box sx={{ flexGrow: 1 }} />

        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onDrawerToggle}
          sx={{
            marginRight: 2,
          }}
        >
          <MenuIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default BottomNavBar;
