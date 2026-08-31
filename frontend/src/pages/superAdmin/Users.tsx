import React from "react";
import { GridColDef } from "@mui/x-data-grid";
import SuperAdminEntityGrid from "./SuperAdminEntityGrid";
import UserForm from "../forms/UserForm";
import { fetchSuperAdminList } from "../../helpers/superAdminApi";

const columns: GridColDef[] = [
  { field: "name", headerName: "Name", flex: 1 },
  { field: "email", headerName: "Email", flex: 1 },
  {
    field: "dogs",
    headerName: "Dogs",
    flex: 1,
    valueGetter: (value: any) => value?.map(({ name }: any) => name).join(", "),
  },
  {
    field: "roles",
    headerName: "Roles",
    flex: 1,
    valueGetter: (value: any) => value?.join(", "),
  },
];

const SuperAdminUsers = () => (
  <SuperAdminEntityGrid
    title="Users"
    entity="users"
    columns={columns}
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
    })}
  />
);

export default SuperAdminUsers;
