import React from "react";
import { GridColDef } from "@mui/x-data-grid";
import SuperAdminEntityGrid from "./SuperAdminEntityGrid";
import DogForm from "../forms/DogForm";

const columns: GridColDef[] = [
  { field: "name", headerName: "Name", flex: 1 },
  { field: "note", headerName: "Note", flex: 1 },
];

const SuperAdminDogs = () => (
  <SuperAdminEntityGrid
    title="Dogs"
    entity="dogs"
    columns={columns}
    emptyFormData={{ name: "" }}
    getEditFormData={(row) => ({ name: row.name })}
    FormComponent={DogForm}
  />
);

export default SuperAdminDogs;
