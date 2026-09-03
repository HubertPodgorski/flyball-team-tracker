import React from "react";
import { Box, Card, Chip, IconButton, Typography, alpha, useTheme } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import UserForm from "../forms/UserForm";
import { useFormHelpers } from "../../hooks/useFormHelpers";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import ChipsGrid from "../../components/ChipsGrid";
import {
  useUsersQuery,
  useDeleteUserMutation,
  useResetUserPasswordMutation,
} from "../../queries/users";

const Users = () => {
  const theme = useTheme();
  const confirm = useConfirmModal();
  const { data: users = [] } = useUsersQuery();
  const deleteUserMutation = useDeleteUserMutation();
  const resetPasswordMutation = useResetUserPasswordMutation();

  const {
    formInitialData,
    editingId,
    formOpen,
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

    deleteUserMutation.mutate(id);
  };

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {users.map(({ name, _id, dogs }) => (
          <Card
            key={_id}
            onClick={() => onEditClick({ name, dogs }, _id)}
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

              {dogs.length > 0 && (
                <ChipsGrid hideIcon>
                  {dogs.map(({ name, _id }) => (
                    <Chip label={name} key={_id} />
                  ))}
                </ChipsGrid>
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

      <UserForm
        onClose={onFormClose}
        open={formOpen}
        initialData={formInitialData}
        editingId={editingId}
        onResetPassword={(id) => resetPasswordMutation.mutateAsync(id)}
      />
    </>
  );
};

export default Users;
