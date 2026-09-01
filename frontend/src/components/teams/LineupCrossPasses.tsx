import React, { useState } from "react";
import { Box, ButtonBase, Typography, styled } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Dog, Lineup, LineupCrossPass } from "../../helpers/types";
import LineupCrossPassModal, {
  LineupCrossPassSaveData,
} from "./LineupCrossPassModal";

interface Props {
  lineup: Lineup;
  editable: boolean;
  onChange: (crossPasses: LineupCrossPass[]) => void;
}

// Dogs are already in running order - each crosses only the one before it.
const buildRunOrder = (dogs: Dog[]) =>
  dogs.map((dog, index) => ({ dog, predecessorDog: dogs[index - 1] }));

// ListStyled owns the columns; rows subgrid into them to stay aligned.
const ListStyled = styled(Box)(({ theme }) => ({
  display: "grid",
  // Arrow column fixed; others share extra width evenly.
  gridTemplateColumns: "minmax(max-content, 1fr) 28px minmax(max-content, 1fr) minmax(max-content, 1fr)",
  rowGap: theme.spacing(1),
}));

const RowStyled = styled(ButtonBase, {
  shouldForwardProp: (prop) => prop !== "clickable",
})<{ clickable?: boolean; component?: React.ElementType }>(({ theme, clickable }) => ({
  display: "grid",
  gridColumn: "1 / -1",
  gridTemplateColumns: "subgrid",
  alignItems: "baseline",
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  border: `1px solid ${theme.palette.secondary.main}`,
  borderRadius: "4px",
  cursor: clickable ? "pointer" : "default",
}));

const findCrossPass = (
  crossPasses: LineupCrossPass[],
  dogId: string,
  predecessorDog?: Dog
) =>
  crossPasses.find(
    (crossPass) =>
      crossPass.dogId === dogId &&
      (predecessorDog
        ? crossPass.runningOnDog?._id === predecessorDog._id
        : crossPass.runningOnLights)
  );

interface ActiveRow {
  dog: Dog;
  predecessorDog?: Dog;
}

const LineupCrossPasses = ({ lineup, editable, onChange }: Props) => {
  const [activeRow, setActiveRow] = useState<ActiveRow | undefined>();

  const activeCrossPass = activeRow
    ? findCrossPass(lineup.crossPasses, activeRow.dog._id, activeRow.predecessorDog)
    : undefined;

  const onSaveRow = (data: LineupCrossPassSaveData) => {
    if (!activeRow) return;

    const { dog, predecessorDog } = activeRow;

    const withoutRow = lineup.crossPasses.filter(
      (crossPass) => crossPass !== activeCrossPass
    );

    const entry: LineupCrossPass = {
      _id: activeCrossPass?._id as string,
      dogId: dog._id,
      runningOnDog: predecessorDog,
      runningOnLights: !predecessorDog,
      ...data,
    };

    if (!activeCrossPass) delete (entry as Partial<LineupCrossPass>)._id;

    onChange([...withoutRow, entry]);
  };

  const onDeleteRow = () => {
    if (!activeCrossPass) return;

    onChange(lineup.crossPasses.filter((crossPass) => crossPass !== activeCrossPass));
  };

  return (
    <ListStyled>
      {buildRunOrder(lineup.dogs).map(({ dog, predecessorDog }) => {
        const crossPass = findCrossPass(lineup.crossPasses, dog._id, predecessorDog);

        return (
          <RowStyled
            key={dog._id}
            component="div"
            clickable={editable}
            onClick={() => editable && setActiveRow({ dog, predecessorDog })}
            disabled={!editable}
          >
            <Typography sx={{ justifySelf: "start" }}>{dog.name}</Typography>

            <ArrowForwardIcon
              fontSize="small"
              color="disabled"
              sx={{ justifySelf: "center", alignSelf: "center" }}
            />

            <Typography color="text.secondary" sx={{ justifySelf: "start" }}>
              {predecessorDog ? predecessorDog.name : "Lights"}
            </Typography>

            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, justifySelf: "end" }}>
              {crossPass ? (
                <>
                  <Typography variant="body2">{crossPass.startingPosition || "—"}</Typography>

                  {crossPass.time !== undefined && (
                    <Typography variant="caption" color="text.secondary">
                      {crossPass.time}s
                    </Typography>
                  )}
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {editable ? "+ add" : "—"}
                </Typography>
              )}
            </Box>
          </RowStyled>
        );
      })}

      {activeRow && (
        <LineupCrossPassModal
          open={!!activeRow}
          onClose={() => setActiveRow(undefined)}
          crossPass={activeCrossPass}
          runnerDog={activeRow.dog}
          predecessorDog={activeRow.predecessorDog}
          onSave={onSaveRow}
          onDelete={onDeleteRow}
        />
      )}
    </ListStyled>
  );
};

export default LineupCrossPasses;
