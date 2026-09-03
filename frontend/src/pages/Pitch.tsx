import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { notAuthenticatedRoutes } from "../helpers/routesAndPaths";

const SECTION_KEYS = ["tasks", "calendar", "myDogs", "teams", "settings"] as const;

const Pitch = () => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card
      sx={{
        maxWidth: 640,
        margin: "20px auto",
        backgroundColor: alpha(theme.palette.background.paper, 0.75),
        backdropFilter: "blur(6px)",
      }}
    >
      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Typography variant="h5">Flyball Team Tracker</Typography>

          <ToggleButtonGroup
            size="small"
            value={i18n.language}
            exclusive
            onChange={(_event, value) => value && i18n.changeLanguage(value)}
          >
            <ToggleButton value="pl">PL</ToggleButton>
            <ToggleButton value="en">EN</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Typography variant="body1" color="text.secondary">
          {t("pitch.intro")}
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {SECTION_KEYS.map((key) => (
            <Box key={key}>
              <Typography variant="subtitle1">{t(`pitch.sections.${key}.title`)}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t(`pitch.sections.${key}.body`)}
              </Typography>
            </Box>
          ))}
        </Box>

        <Divider />

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 1.5,
            }}
          >
            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate({ to: notAuthenticatedRoutes.login })}
            >
              {t("pitch.login")}
            </Button>

            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate({ to: notAuthenticatedRoutes.signup })}
            >
              {t("pitch.signup")}
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary">
            {t("pitch.needCode")}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Pitch;
