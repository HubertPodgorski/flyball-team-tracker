import React from "react";
import { GridColDef } from "@mui/x-data-grid";
import SuperAdminEntityGrid from "./SuperAdminEntityGrid";
import DogTaskForm from "../forms/DogTaskForm";

const columns: GridColDef[] = [{ field: "name", headerName: "Name", flex: 1 }];

const SuperAdminDogTasks = () => (
  <SuperAdminEntityGrid
    title="Dog tasks"
    entity="dog-tasks"
    columns={columns}
    emptyFormData={{ name: "" }}
    getEditFormData={(row) => ({ name: row.name })}
    FormComponent={DogTaskForm}
  />
);

export default SuperAdminDogTasks;
