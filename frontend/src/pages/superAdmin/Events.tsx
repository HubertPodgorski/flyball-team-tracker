import React from "react";
import { GridColDef } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
import SuperAdminEntityGrid from "./SuperAdminEntityGrid";
import EventForm from "../forms/EventForm";
import { EventType } from "../../components/inputs/consts";
import { formatDate } from "../../helpers/dateHelpers";

const getColumns = (t: (key: string) => string): GridColDef[] => [
  { field: "name", headerName: t("common.name"), flex: 1 },
  {
    field: "date",
    headerName: t("common.date"),
    flex: 1,
    valueFormatter: (value: any) =>
      value ? formatDate(value, "dd/MM/yyyy HH:mm") : "",
    sortComparator: (a: any, b: any) =>
      new Date(a).getTime() - new Date(b).getTime(),
  },
  { field: "type", headerName: t("pages.superAdmin.typeColumn"), flex: 1 },
];

const SuperAdminEvents = () => {
  const { t } = useTranslation();

  return (
    <SuperAdminEntityGrid
      title={t("pages.superAdmin.eventsTitle")}
      entity="events"
      columns={getColumns(t)}
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
};

export default SuperAdminEvents;
