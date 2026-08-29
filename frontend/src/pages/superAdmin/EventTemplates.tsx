import React from "react";
import { GridColDef } from "@mui/x-data-grid";
import SuperAdminEntityGrid from "./SuperAdminEntityGrid";
import EventTemplateForm from "../forms/EventTemplateForm";

const columns: GridColDef[] = [
  { field: "name", headerName: "Name", flex: 1 },
  {
    field: "tasks",
    headerName: "Tasks",
    flex: 1,
    valueGetter: (value: any) => value?.length ?? 0,
  },
];

const SuperAdminEventTemplates = () => (
  <SuperAdminEntityGrid
    title="Event templates"
    entity="event-templates"
    columns={columns}
    emptyFormData={{ name: "" }}
    getEditFormData={(row) => ({ name: row.name })}
    FormComponent={EventTemplateForm}
    allowAdd={false}
  />
);

export default SuperAdminEventTemplates;
