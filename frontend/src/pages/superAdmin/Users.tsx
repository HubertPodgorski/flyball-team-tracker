import React from "react";
import { GridColDef } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
import SuperAdminEntityGrid from "./SuperAdminEntityGrid";
import UserForm from "../forms/UserForm";
import {
  fetchSuperAdminList,
  resetSuperAdminUserPassword,
} from "../../helpers/superAdminApi";

const getColumns = (t: (key: string) => string): GridColDef[] => [
  { field: "name", headerName: t("common.name"), flex: 1 },
  { field: "email", headerName: t("common.email"), flex: 1 },
  {
    field: "dogs",
    headerName: t("common.dogs"),
    flex: 1,
    valueGetter: (value: any) => value?.map(({ name }: any) => name).join(", "),
  },
  {
    field: "roles",
    headerName: t("common.roles"),
    flex: 1,
    valueGetter: (value: any) => value?.join(", "),
  },
];

const SuperAdminUsers = () => {
  const { t } = useTranslation();

  return (
    <SuperAdminEntityGrid
      title={t("pages.superAdmin.usersTitle")}
      entity="users"
      columns={getColumns(t)}
      emptyFormData={{ name: "", dogs: [], roles: [] }}
      getEditFormData={(row) => ({
        name: row.name,
        dogs: row.dogs,
        team: row.team,
        roles: row.roles,
      })}
      FormComponent={UserForm}
      allowAdd={false}
      resolveFormExtraProps={async (team) => ({
        dogsOverride: await fetchSuperAdminList("dogs", team),
        onResetPassword: resetSuperAdminUserPassword,
      })}
    />
  );
};

export default SuperAdminUsers;
