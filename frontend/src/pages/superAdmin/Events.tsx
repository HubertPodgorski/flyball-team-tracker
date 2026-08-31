import React from "react";
import { GridColDef } from "@mui/x-data-grid";
import SuperAdminEntityGrid from "./SuperAdminEntityGrid";
import EventForm from "../forms/EventForm";
import { EventType } from "../../components/inputs/consts";
import { formatDate } from "../../helpers/dateHelpers";

const columns: GridColDef[] = [
  { field: "name", headerName: "Name", flex: 1 },
  {
    field: "date",
    headerName: "Date",
    flex: 1,
    valueFormatter: (value: any) =>
      value ? formatDate(value, "dd/MM/yyyy HH:mm") : "",
    sortComparator: (a: any, b: any) =>
      new Date(a).getTime() - new Date(b).getTime(),
  },
  { field: "type", headerName: "Type", flex: 1 },
];

const SuperAdminEvents = () => (
  <SuperAdminEntityGrid
    title="Events"
    entity="events"
    columns={columns}
    emptyFormData={{
      type: EventType.TRAINING,
      name: "",
      date: new Date().toString(),
      dogs: [],
    }}
    getEditFormData={(row) => ({
      name: row.name,
      date: row.date,
      type: row.type ?? EventType.TRAINING,
      team: row.team,
    })}
    FormComponent={EventForm}
  />
);

export default SuperAdminEvents;
