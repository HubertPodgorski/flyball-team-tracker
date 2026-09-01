import { Autocomplete, Box, Card, IconButton, TextField, Typography } from "@mui/material";
import { useAuthContext } from "../../hooks/useAuthContext";
import { useAppContext } from "../../hooks/useAppContext";
import { useSocketContext } from "../../hooks/useSocketContext";
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

const MyDogs = () => {
  const { user } = useAuthContext();
  const { dogs, crossPasses } = useAppContext();
  const { socket } = useSocketContext();
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
  const [pickedDog, setPickedDog] = useState<Dog | null>(null);

  // Super-admins have no dogs of their own - let them pick any dog instead.
  const dogsToShow = isSuperAdmin
    ? [pickedDog].filter((dog): dog is Dog => !!dog)
    : userDogs;

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

    socket.emit("delete_cross_pass", { _id: crossPassId });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {isSuperAdmin && (
        <Autocomplete
          options={dogs}
          getOptionLabel={(dog) => dog.name}
          isOptionEqualToValue={(option, value) => option._id === value._id}
          value={pickedDog}
          onChange={(_event, dog) => setPickedDog(dog)}
          renderInput={(params) => <TextField {...params} label="Dog" />}
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

          <Box
            sx={{
              display: "flex",
              alignItems: "flex-end",
              gap: 1,
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Typography variant="caption">Notes:</Typography>

              <Typography>{dog.note || "Click button to add notes"}</Typography>
            </Box>

            <IconButton onClick={() => setIsNoteModalOpen(dog)}>
              <EditNoteIcon />
            </IconButton>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="caption">Cross Passes</Typography>

            <DataGrid
              rows={getCrossPassesForDog(dog._id)}
              getRowId={(row) => row._id}
              columns={[
                {
                  headerName: "Running on",
                  field: "runningOnLights",
                  flex: 1,
                  valueGetter: (_, { runningOnLights, runningOnDog }) =>
                    runningOnLights ? "Lights" : runningOnDog?.name,
                },
                {
                  headerName: "Starting position",
                  field: "startingPosition",
                  flex: 1,
                },
                {
                  headerName: "Time (s)",
                  field: "time",
                  flex: 1,
                },
                {
                  headerName: "Notes",
                  field: "note",
                  flex: 1,
                },
                {
                  headerName: "Actions",
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
