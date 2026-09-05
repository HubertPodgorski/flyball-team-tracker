import React from "react";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

type StepColor = "success" | "secondary" | "primary" | "warning" | "info";

interface Props {
  // i18n namespace holding `${key}.title` / `${key}.body` for each step.
  namespace: string;
  steps: readonly { key: string; color: StepColor }[];
}

const WorkflowSteps = ({ namespace, steps }: Props) => {
  const { t } = useTranslation();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {steps.map(({ key, color }, index) => (
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
            <Typography variant="subtitle1">{t(`${namespace}.${key}.title`)}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t(`${namespace}.${key}.body`)}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default WorkflowSteps;
