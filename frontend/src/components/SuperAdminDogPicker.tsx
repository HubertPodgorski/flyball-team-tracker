import React from "react";
import { Autocomplete } from "@mui/material";
import { useTranslation } from "react-i18next";
import PickListInput from "./inputs/PickListInput";
import { Dog } from "../helpers/types";

interface Props {
  allDogs: Dog[];
  pickedDogs: Dog[];
  onChange: (dogIds: string[]) => void;
}

// Only meaningful for a super-admin (no dogs of their own) - the caller decides whether to render it at all.
const SuperAdminDogPicker = ({ allDogs, pickedDogs, onChange }: Props) => {
  const { t } = useTranslation();

  return (
    <Autocomplete
      multiple
      options={allDogs}
      getOptionLabel={(dog) => dog.name}
      isOptionEqualToValue={(option, value) => option._id === value._id}
      value={pickedDogs}
      onChange={(_event, newDogs) => onChange(newDogs.map(({ _id }) => _id))}
      renderInput={(params) => <PickListInput params={params} label={t("pages.myDogs.dogLabel")} />}
    />
  );
};

export default SuperAdminDogPicker;
