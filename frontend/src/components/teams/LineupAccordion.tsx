import React, { useState } from "react";
import { Accordion, AccordionDetails, Box, IconButton, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteIcon from "@mui/icons-material/Delete";
import FixedHeightAccordionSummary from "../FixedHeightAccordionSummary";
import { Dog, Lineup, LineupCrossPass } from "../../helpers/types";
import { formatLineupLabel } from "../../helpers/lineup";
import DogChain from "./DogChain";
import LineupNameField from "./LineupNameField";
import LineupDogsOrder from "./LineupDogsOrder";
import LineupCrossPasses from "./LineupCrossPasses";

interface Props {
  lineup: Lineup;
  editable: boolean;
  onDelete: () => void;
  onSaveName: (name: string) => void;
  onDogsChange: (dogs: Dog[]) => void;
  onCrossPassesChange: (crossPasses: LineupCrossPass[]) => void;
}

const LineupAccordion = ({
  lineup,
  editable,
  onDelete,
  onSaveName,
  onDogsChange,
  onCrossPassesChange,
}: Props) => {
  const { t } = useTranslation();
  // Controlled - avoids the CSS ".Mui-expanded &" trick.
  const [expanded, setExpanded] = useState(false);

  return (
    <Accordion
      expanded={expanded}
      onChange={(_event, isExpanded) => setExpanded(isExpanded)}
      disableGutters
      elevation={0}
      sx={{ background: "none", "&::before": { display: "none" } }}
    >
      <FixedHeightAccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ paddingLeft: 0, paddingRight: 0 }}>
        <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1, minWidth: 0, gap: 0.5 }}>
          <Typography>{formatLineupLabel(lineup, t("pages.teams.lineupFallback"))}</Typography>

          <DogChain dogs={lineup.dogs} variant="caption" color="text.secondary" noWrap />
        </Box>

        {editable && (
          // component="span" - avoids nesting a <button> in AccordionSummary's own <button>.
          <IconButton
            component="span"
            size="small"
            color="error"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      </FixedHeightAccordionSummary>

      <AccordionDetails
        sx={{ display: "flex", flexDirection: "column", gap: 1, paddingLeft: 0, paddingRight: 0 }}
      >
        {editable && <LineupNameField lineup={lineup} onSave={onSaveName} />}

        <LineupDogsOrder dogs={lineup.dogs} editable={editable} onChange={onDogsChange} />

        {/* Cross-pass times/notes are editable by any team member - only
            the team/lineup structure (dogs, order) is trainer-only. */}
        <LineupCrossPasses lineup={lineup} editable onChange={onCrossPassesChange} />
      </AccordionDetails>
    </Accordion>
  );
};

export default LineupAccordion;
