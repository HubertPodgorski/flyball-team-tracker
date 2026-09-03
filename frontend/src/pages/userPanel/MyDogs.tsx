import { Autocomplete, Box, Card, IconButton, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useAuthContext } from "../../hooks/useAuthContext";
import { useDogsQuery } from "../../queries/dogs";
import { useCrossPassesQuery, useDeleteCrossPassMutation } from "../../queries/crossPasses";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import { useIsSuperAdmin } from "../../hooks/useIsSuperAdmin";
import React, { useEffect, useState } from "react";
import EditNoteIcon from "@mui/icons-material/EditNote";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import NoteModal from "../../components/modals/NoteModal";
import CrossPassModal from "../../components/modals/CrossPassModal";
import { CrossPass, Dog } from "../../helpers/types";
import { DataGrid } from "@mui/x-data-grid";
import { getDataGridLocaleText } from "../../helpers/dataGridLocale";

const MyDogs = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuthContext();
  const { data: dogs = [] } = useDogsQuery();
  const { data: crossPasses = [] } = useCrossPassesQuery();
  const deleteCrossPassMutation = useDeleteCrossPassMutation();
  const confirm = useConfirmModal();
  const isSuperAdmin = useIsSuperAdmin();

  const [isNoteModalOpen, setIsNoteModalOpen] = useState<Dog | undefined>();
  const [crossPassForDogId, setCrossPassForDogId] = useState<
    string | undefined
  >();
  const [editingCrossPass, setEditingCrossPass] = useState<
    CrossPass | undefined
  >();
  const [userDogs, setUserDogs] = useState(user?.dogs || []);
  const [pickedDogIds, setPickedDogIds] = useState<string[]>([]);

  // Derived fresh from the live query every render (not a snapshot taken at
  // pick time) - otherwise a note/jump-height/sync edit wouldn't visibly
  // show here until reload, since it'd be reading a stale copy.
  const pickedDogs = dogs.filter(({ _id }) => pickedDogIds.includes(_id));

  // Super-admins have no dogs of their own - let them pick any dogs instead.
  const dogsToShow = isSuperAdmin ? pickedDogs : userDogs;

  useEffect(() => {
    const userDogIds = user!.dogs.map(({ _id }) => _id);

    setUserDogs(
      dogs
        .filter(({ _id }) => userDogIds.includes(_id))
        .sort(({ name: aName }, { name: bName }) => {
          if (aName > bName) return 1;

          if (bName > aName) return -1;

          return 0;
        })
    );
  }, [user, dogs]);

  const getCrossPassesForDog = (givenDogId: string): CrossPass[] =>
    crossPasses.filter(({ dogId }) => dogId === givenDogId);

  const onDeleteCrossPass = async (crossPassId: string) => {
    try {
      await confirm();
    } catch {
      return;
    }

    deleteCrossPassMutation.mutate(crossPassId);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {isSuperAdmin && (
        <Autocomplete
          multiple
          options={dogs}
          getOptionLabel={(dog) => dog.name}
          isOptionEqualToValue={(option, value) => option._id === value._id}
          value={pickedDogs}
          onChange={(_event, newDogs) => setPickedDogIds(newDogs.map(({ _id }) => _id))}
          renderInput={(params) => <TextField {...params} label={t("pages.myDogs.dogLabel")} />}
        />
      )}

      {dogsToShow.map((dog) => (
        <Card
          key={dog._id}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            padding: 1,
          }}
        >
          <Typography variant="h6">{dog.name}</Typography>

          {dog.jumpHeight !== undefined && (
            <Typography variant="caption" color="text.secondary">
              {t("pages.myDogs.jumpHeight", { height: dog.jumpHeight })}
            </Typography>
          )}

          <Box
            sx={{
              display: "flex",
              alignItems: "flex-end",
              gap: 1,
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Typography variant="caption">{t("pages.myDogs.notes")}:</Typography>

              <Typography>{dog.note || t("pages.myDogs.noNotesPlaceholder")}</Typography>
            </Box>

            <IconButton onClick={() => setIsNoteModalOpen(dog)}>
              <EditNoteIcon />
            </IconButton>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="caption">{t("pages.myDogs.crossPasses")}</Typography>

            <DataGrid
              localeText={getDataGridLocaleText(i18n.language)}
              rows={getCrossPassesForDog(dog._id)}
              getRowId={(row) => row._id}
              columns={[
                {
                  headerName: t("pages.myDogs.runningOn"),
                  field: "runningOnLights",
                  flex: 1,
                  valueGetter: (_, { runningOnLights, runningOnDog }) =>
                    runningOnLights ? t("pages.teams.lights") : runningOnDog?.name,
                },
                {
                  headerName: t("modals.crossPass.startingPosition"),
                  field: "startingPosition",
                  flex: 1,
                },
                {
                  headerName: t("modals.crossPass.time"),
                  field: "time",
                  flex: 1,
                },
                {
                  headerName: t("pages.myDogs.notes"),
                  field: "note",
                  flex: 1,
                },
                {
                  headerName: t("pages.myDogs.actions"),
                  field: "actions",
                  sortable: false,
                  renderCell: ({ row }) => (
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <IconButton
                        onClick={(event) => {
                          event.stopPropagation();

                          onDeleteCrossPass(row._id);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>

                      <IconButton
                        onClick={() => {
                          setEditingCrossPass(row);
                          setCrossPassForDogId(dog._id);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Box>
                  ),
                },
              ]}
              disableRowSelectionOnClick
              hideFooter
              disableColumnMenu
            />

            <IconButton
              onClick={() => setCrossPassForDogId(dog._id)}
              sx={{ alignSelf: "flex-end" }}
            >
              <AddIcon />
            </IconButton>
          </Box>
        </Card>
      ))}

      <NoteModal
        dog={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(undefined)}
        open={!!isNoteModalOpen}
      />

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

export default MyDogs;
