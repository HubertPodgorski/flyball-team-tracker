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

const WORKFLOW = [
  { key: "addDogs", color: "success" },
  { key: "buildTeams", color: "secondary" },
  { key: "addTasks", color: "primary" },
  { key: "setCrossPasses", color: "warning" },
  { key: "liveSync", color: "info" },
] as const;

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

        <Box>
          <Typography variant="overline" color="text.secondary">
            {t("pitch.howItWorks")}
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, marginTop: 1 }}>
            {WORKFLOW.map(({ key, color }, index) => (
              <Box
                key={key}
                sx={{
                  display: "flex",
                  gap: 1.5,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1.5,
                  padding: 1.5,
                }}
              >
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    flexShrink: 0,
                    borderRadius: "50%",
                    border: "1px solid",
                    borderColor: `${color}.main`,
                    color: `${color}.main`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                  }}
                >
                  {index + 1}
                </Box>
                <Box>
                  <Typography variant="subtitle1">{t(`pitch.workflow.${key}.title`)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t(`pitch.workflow.${key}.body`)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
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
