import React from "react";
import { GridColDef } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
import SuperAdminEntityGrid from "./SuperAdminEntityGrid";
import DogTaskForm from "../forms/DogTaskForm";

const getColumns = (t: (key: string) => string): GridColDef[] => [
  { field: "name", headerName: t("common.name"), flex: 1 },
];

const SuperAdminDogTasks = () => {
  const { t } = useTranslation();

  return (
    <SuperAdminEntityGrid
      title={t("pages.superAdmin.dogTasksTitle")}
      entity="dog-tasks"
      columns={getColumns(t)}
      emptyFormData={{ name: "" }}
      getEditFormData={(row) => ({ name: row.name, team: row.team })}
      FormComponent={DogTaskForm}
    />
  );
};

export default SuperAdminDogTasks;
