import React from "react";
import { GridColDef } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
import SuperAdminEntityGrid from "./SuperAdminEntityGrid";
import ResourceForm from "../forms/ResourceForm";

const getColumns = (t: (key: string) => string): GridColDef[] => [
  { field: "name", headerName: t("common.name"), flex: 1 },
  { field: "url", headerName: t("forms.resource.url"), flex: 1 },
];

const SuperAdminResources = () => {
  const { t } = useTranslation();

  return (
    <SuperAdminEntityGrid
      title={t("pages.superAdmin.resourcesTitle")}
      entity="resources"
      columns={getColumns(t)}
      emptyFormData={{ name: "", url: "" }}
      getEditFormData={(row) => ({ name: row.name, url: row.url, team: row.team })}
      FormComponent={ResourceForm}
    />
  );
};

export default SuperAdminResources;
