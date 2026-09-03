import React from "react";
import { GridColDef } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
import SuperAdminEntityGrid from "./SuperAdminEntityGrid";
import DogForm from "../forms/DogForm";

const getColumns = (t: (key: string) => string): GridColDef[] => [
  { field: "name", headerName: t("common.name"), flex: 1 },
  { field: "note", headerName: t("common.note"), flex: 1 },
  { field: "jumpHeight", headerName: t("forms.dog.jumpHeight"), flex: 1 },
];

const SuperAdminDogs = () => {
  const { t } = useTranslation();

  return (
    <SuperAdminEntityGrid
      title={t("pages.superAdmin.dogsTitle")}
      entity="dogs"
      columns={getColumns(t)}
      emptyFormData={{ name: "", note: "", jumpHeight: "" }}
      getEditFormData={(row) => ({
        name: row.name,
        note: row.note,
        team: row.team,
        jumpHeight: row.jumpHeight,
      })}
      FormComponent={DogForm}
    />
  );
};

export default SuperAdminDogs;
