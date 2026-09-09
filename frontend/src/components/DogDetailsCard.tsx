import React, { useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useCrossPassesQuery } from "../queries/crossPasses";
import { useUpdateDogMutation } from "../queries/dogs";
import { CrossPass, Dog } from "../helpers/types";
import CrossPassModal from "./modals/CrossPassModal";

interface Props {
  dog: Dog;
  // False for a regular user looking at someone else's dog - same data, no edit affordances.
  canEdit: boolean;
  // My Dogs shows the name as its own card heading already - a modal's own title covers it there instead.
  showName?: boolean;
}

// A cross pass's "running at" cell - the dog it follows, or the lights if it's the first dog out.
const runningOnLabel = (crossPass: CrossPass, t: (key: string) => string) =>
  crossPass.runningOnLights ? t("pages.teams.lights") : crossPass.runningOnDog?.name ?? "";

// The "My Dogs" card content, shared with the dog-details modal opened from a task's dog chip - one copy, not two.
const DogDetailsCard = ({ dog, canEdit, showName = true }: Props) => {
  const { t } = useTranslation();
  const { data: crossPasses = [] } = useCrossPassesQuery();
  const updateDogMutation = useUpdateDogMutation();

  const [note, setNote] = useState(dog.note || "");
  const [crossPassForDogId, setCrossPassForDogId] = useState<string | undefined>();
  const [editingCrossPass, setEditingCrossPass] = useState<CrossPass | undefined>();

  const dogCrossPasses = crossPasses.filter(({ dogId }) => dogId === dog._id);
  const crossColumnLabel = `${t("modals.crossPass.startingPosition")} / ${t("modals.crossPass.time")}`;

  const onNoteBlur = () => {
    if (note === (dog.note || "")) return;

    updateDogMutation.mutate({ _id: dog._id, note });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {showName && <Typography variant="h6">{dog.name}</Typography>}

      {dog.jumpHeight !== undefined && (
        <Typography variant="caption" color="text.secondary">
          {t("pages.myDogs.jumpHeight", { height: dog.jumpHeight })}
        </Typography>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        {canEdit ? (
          <TextField
            label={t("pages.myDogs.notes")}
            multiline
            minRows={5}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            onBlur={onNoteBlur}
            placeholder={t("pages.myDogs.notesPlaceholder")}
          />
        ) : (
          <>
            <Typography variant="caption">{t("pages.myDogs.notes")}:</Typography>
            <Typography>{dog.note || t("pages.myDogs.noNotesPlaceholder")}</Typography>
          </>
        )}
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography variant="caption">{t("pages.myDogs.crossPasses")}</Typography>

        {dogCrossPasses.length > 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {t("pages.myDogs.runningOn")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {crossColumnLabel}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t("pages.myDogs.notes")}
              </Typography>
            </Box>

            {dogCrossPasses.map((crossPass) => (
              <Box
                key={crossPass._id}
                onClick={
                  canEdit
                    ? () => {
                        setEditingCrossPass(crossPass);
                        setCrossPassForDogId(dog._id);
                      }
                    : undefined
                }
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 1,
                  paddingY: 1,
                  borderTop: 1,
                  borderColor: "divider",
                  cursor: canEdit ? "pointer" : "default",
                }}
              >
                <Typography variant="body2">{runningOnLabel(crossPass, t)}</Typography>
                <Typography variant="body2">{[crossPass.startingPosition, crossPass.time].filter(Boolean).join(" · ") || "—"}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {crossPass.note || "—"}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {t("pages.myDogs.noCrossPasses")}
          </Typography>
        )}

        {canEdit && (
          <Button variant="outlined" size="small" onClick={() => setCrossPassForDogId(dog._id)} sx={{ alignSelf: "flex-start" }}>
            {t("pages.myDogs.addCrossPass")}
          </Button>
        )}
      </Box>

      <CrossPassModal
        dogId={crossPassForDogId}
        onClose={() => {
          setCrossPassForDogId(undefined);
          setEditingCrossPass(undefined);
        }}
        open={!!crossPassForDogId}
        crossPass={editingCrossPass}
      />
    </Box>
  );
};

export default DogDetailsCard;
