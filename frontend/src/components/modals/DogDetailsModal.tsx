import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import Modal from "./Modal";
import DogDetailsCard from "../DogDetailsCard";
import { useDogsQuery } from "../../queries/dogs";
import { useAuthContext } from "../../hooks/useAuthContext";
import { useIsTrainer } from "../../hooks/useIsTrainer";
import { isMyDog } from "../../helpers/tasks";

interface Props {
  // Undefined/empty closes the modal - a task's own dog only carries {_id, name}, so the live Dog is looked up here.
  dogId: string | undefined;
  onClose: () => void;
}

// Opened from a dog chip on a task - a trainer or the dog's own owner can edit here, exactly like on My Dogs.
const DogDetailsModal = ({ dogId, onClose }: Props) => {
  const { t } = useTranslation();
  const { data: dogs = [] } = useDogsQuery();
  const { user } = useAuthContext();
  const isTrainer = useIsTrainer();

  const dog = dogs.find(({ _id }) => _id === dogId);
  const canEdit = isTrainer || (!!dog && isMyDog(dog._id, user?.dogs ?? []));

  return (
    <Modal open={!!dogId} onClose={onClose} title={dog?.name ?? ""}>
      {/* dog can briefly be undefined - the dogs query may not have resolved yet on the very first click. */}
      {dog ? <DogDetailsCard dog={dog} canEdit={canEdit} showName={false} /> : <Typography color="text.secondary">…</Typography>}

      <Box sx={{ display: "flex", justifyContent: "flex-end", marginTop: 2 }}>
        <Button variant="outlined" onClick={onClose}>
          {t("common.close")}
        </Button>
      </Box>
    </Modal>
  );
};

export default DogDetailsModal;
