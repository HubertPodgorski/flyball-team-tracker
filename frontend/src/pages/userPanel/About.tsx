import React from "react";
import { Box, Chip, Divider, List, ListItem, ListItemText, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useIsTrainer } from "../../hooks/useIsTrainer";
import WorkflowSteps from "../../components/WorkflowSteps";

const TRAINER_WORKFLOW = [
  { key: "addDogs", color: "success" },
  { key: "buildTeams", color: "secondary" },
  { key: "buildLineups", color: "primary" },
  { key: "addTasks", color: "warning" },
  { key: "setCrossPasses", color: "info" },
] as const;

interface SectionProps {
  id: string;
  title: string;
  intro?: string;
  items: string[];
}

// Scrolls within the app's own scrolling content region, same trick the calendar's push-notification deep link uses.
const scrollToSection = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

const SectionBlock = ({ id, title, intro, items }: SectionProps) => (
  <Box id={id} sx={{ display: "flex", flexDirection: "column", gap: 0.5, scrollMarginTop: 8 }}>
    <Typography variant="h6">{title}</Typography>

    {intro && (
      <Typography variant="body2" color="text.secondary">
        {intro}
      </Typography>
    )}

    <List dense sx={{ pl: 2 }}>
      {items.map((item) => (
        <ListItem key={item} sx={{ display: "list-item", listStyleType: "disc", pl: 0 }}>
          <ListItemText primary={item} />
        </ListItem>
      ))}
    </List>
  </Box>
);

const About = () => {
  const { t } = useTranslation();
  const isTrainer = useIsTrainer();

  const sections: SectionProps[] = [
    {
      id: "tasks",
      title: t("about.sections.tasks.title"),
      items: t("about.sections.tasks.items", { returnObjects: true }) as string[],
    },
    {
      id: "calendar",
      title: t("about.sections.calendar.title"),
      items: t("about.sections.calendar.items", { returnObjects: true }) as string[],
    },
    {
      id: "myDogs",
      title: t("about.sections.myDogs.title"),
      items: t("about.sections.myDogs.items", { returnObjects: true }) as string[],
    },
    {
      id: "teams",
      title: t("about.sections.teams.title"),
      items: t("about.sections.teams.items", { returnObjects: true }) as string[],
    },
    {
      id: "resources",
      title: t("about.sections.resources.title"),
      items: t("about.sections.resources.items", { returnObjects: true }) as string[],
    },
    {
      id: "settings",
      title: t("about.sections.settings.title"),
      items: t("about.sections.settings.items", { returnObjects: true }) as string[],
    },
  ];

  const trainerNavItems = isTrainer
    ? [
        { id: "trainerWorkflow", label: t("about.trainerWorkflow.title") },
        { id: "trainerSection", label: t("about.trainerSection.title") },
      ]
    : [];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h5">{t("about.title")}</Typography>

      <Typography variant="body1" color="text.secondary">
        {t("about.intro")}
      </Typography>

      <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
        {[...sections.map(({ id, title }) => ({ id, label: title })), ...trainerNavItems].map(({ id, label }) => (
          <Chip key={id} label={label} size="small" onClick={() => scrollToSection(id)} />
        ))}
      </Stack>

      {sections.map((section) => (
        <SectionBlock key={section.id} {...section} />
      ))}

      {isTrainer && (
        <>
          <Divider />

          <Box id="trainerWorkflow" sx={{ display: "flex", flexDirection: "column", gap: 0.5, scrollMarginTop: 8 }}>
            <Typography variant="h6">{t("about.trainerWorkflow.title")}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t("about.trainerWorkflow.intro")}
            </Typography>

            <Box sx={{ marginTop: 1 }}>
              <WorkflowSteps namespace="about.trainerWorkflow.steps" steps={TRAINER_WORKFLOW} />
            </Box>
          </Box>

          <Divider />

          <SectionBlock
            id="trainerSection"
            title={t("about.trainerSection.title")}
            intro={t("about.trainerSection.intro")}
            items={t("about.trainerSection.items", { returnObjects: true }) as string[]}
          />
        </>
      )}
    </Box>
  );
};

export default About;
