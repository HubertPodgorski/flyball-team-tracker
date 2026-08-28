import React from "react";
import { Box, Chip, IconButton, List, ListItem } from "@mui/material";
import CenteredContent from "../../components/CenteredContent";
import DeleteIcon from "@mui/icons-material/Delete";
import UserForm from "../forms/UserForm";
import { useFormHelpers } from "../../hooks/useFormHelpers";
import { useAppContext } from "../../hooks/useAppContext";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import ChipsGrid from "../../components/ChipsGrid";
import { useSocketContext } from "../../hooks/useSocketContext";

const Users = () => {
  const { socket } = useSocketContext();
  const confirm = useConfirmModal();
  const { users } = useAppContext();

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
    await confirm();

    socket.emit("delete_user", { _id: id });
  };

  return (
    <>
      <CenteredContent>
        <List>
          {users.map(({ name, _id, dogs }) => (
            <ListItem
              divider
              key={_id}
              onClick={() => onEditClick({ name, dogs }, _id)}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box>
                {name}

                {dogs.length > 0 && (
                  <ChipsGrid>
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
            </ListItem>
          ))}
        </List>
      </CenteredContent>

      <UserForm
        onClose={onFormClose}
        open={formOpen}
        initialData={formInitialData}
        editingId={editingId}
      />
    </>
  );
};

export default Users;
