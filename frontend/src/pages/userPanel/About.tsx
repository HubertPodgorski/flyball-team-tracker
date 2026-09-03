import React from "react";
import { Box, Divider, List, ListItem, ListItemText, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useIsTrainer } from "../../hooks/useIsTrainer";

interface SectionProps {
  title: string;
  intro?: string;
  items: string[];
}

const SectionBlock = ({ title, intro, items }: SectionProps) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
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
      title: t("about.sections.tasks.title"),
      items: t("about.sections.tasks.items", { returnObjects: true }) as string[],
    },
    {
      title: t("about.sections.calendar.title"),
      items: t("about.sections.calendar.items", { returnObjects: true }) as string[],
    },
    {
      title: t("about.sections.myDogs.title"),
      items: t("about.sections.myDogs.items", { returnObjects: true }) as string[],
    },
    {
      title: t("about.sections.teams.title"),
      items: t("about.sections.teams.items", { returnObjects: true }) as string[],
    },
    {
      title: t("about.sections.settings.title"),
      items: t("about.sections.settings.items", { returnObjects: true }) as string[],
    },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h5">{t("about.title")}</Typography>

      <Typography variant="body1" color="text.secondary">
        {t("about.intro")}
      </Typography>

      {sections.map((section) => (
        <SectionBlock key={section.title} {...section} />
      ))}

      {isTrainer && (
        <>
          <Divider />

          <SectionBlock
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
