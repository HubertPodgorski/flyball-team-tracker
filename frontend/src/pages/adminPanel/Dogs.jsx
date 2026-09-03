import React from "react";
import DogForm from "../forms/DogForm";
import { Box, Card, IconButton, Typography, alpha, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import AddFab, { FAB_CONTENT_CLEARANCE } from "../../components/AddFab";
import DeleteIcon from "@mui/icons-material/Delete";
import { useFormHelpers } from "../../hooks/useFormHelpers";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import { useDogsQuery, useDeleteDogMutation } from "../../queries/dogs";

const Dogs = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { data: dogs = [] } = useDogsQuery();
  const deleteDogMutation = useDeleteDogMutation();
  const confirm = useConfirmModal();

  const {
    formInitialData,
    editingId,
    formOpen,
    setFormOpen,
    onEditClick,
    onFormClose,
  } = useFormHelpers({
    name: "",
    dogs: [],
  });

  const onDeleteClick = async (id) => {
    try {
      await confirm();
    } catch {
      return;
    }

    deleteDogMutation.mutate(id);
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          marginBottom: `${FAB_CONTENT_CLEARANCE}px`,
        }}
      >
        {dogs.map(({ name, _id, jumpHeight }) => (
          <Card
            key={_id}
            onClick={() => onEditClick({ name, jumpHeight }, _id)}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: theme.spacing(1, 2),
              cursor: "pointer",
              backgroundColor: alpha(theme.palette.background.paper, 0.75),
              backdropFilter: "blur(6px)",
            }}
          >
            <Box>
              <Typography>{name}</Typography>

              {jumpHeight !== undefined && (
                <Typography variant="caption" color="text.secondary">
                  {t("pages.myDogs.jumpHeight", { height: jumpHeight })}
                </Typography>
              )}
            </Box>

            <IconButton
              color="error"
              onClick={(event) => {
                event.stopPropagation();

                onDeleteClick(_id);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Card>
        ))}
      </Box>

      <AddFab onClick={() => setFormOpen(true)} />

      <DogForm
        onClose={onFormClose}
        open={formOpen}
        initialData={formInitialData}
        editingId={editingId}
      />
    </>
  );
};

export default Dogs;
