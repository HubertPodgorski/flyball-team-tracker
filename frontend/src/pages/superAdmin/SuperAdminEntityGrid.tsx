import React, { useEffect, useState } from "react";
import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
} from "@mui/x-data-grid";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useSnackbar } from "notistack";
import AddFab, { FAB_CONTENT_CLEARANCE } from "../../components/AddFab";
import { TEAMS } from "../../helpers/teams";
import {
  createSuperAdminItem,
  deleteSuperAdminItem,
  fetchSuperAdminList,
  updateSuperAdminItem,
} from "../../helpers/superAdminApi";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import { useFormHelpers } from "../../hooks/useFormHelpers";

interface Props {
  title: string;
  entity: string;
  columns: GridColDef[];
  emptyFormData: object;
  getEditFormData: (row: any) => object;
  FormComponent: React.ComponentType<any>;
  allowAdd?: boolean;
  // called with the team a row being added/edited belongs (or will belong)
  // to - lets a specific entity page (e.g. users, for their dogs select)
  // fetch team-scoped extras the reused admin form needs as props.
  resolveFormExtraProps?: (team: string) => Promise<object>;
}

const SuperAdminEntityGrid = ({
  title,
  entity,
  columns,
  emptyFormData,
  getEditFormData,
  FormComponent,
  allowAdd = true,
  resolveFormExtraProps,
}: Props) => {
  const [team, setTeam] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formExtraProps, setFormExtraProps] = useState<object>({});
  const confirm = useConfirmModal();
  const { enqueueSnackbar } = useSnackbar();

  const {
    formInitialData,
    editingId,
    formOpen,
    setFormOpen,
    onEditClick,
    onFormClose,
  } = useFormHelpers(emptyFormData);

  const load = async () => {
    setLoading(true);

    try {
      const data = await fetchSuperAdminList(entity, team || undefined);

      setRows(data);
    } catch {
      enqueueSnackbar("Failed to load data", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity, team]);

  const onDeleteClick = async (row: any) => {
    try {
      await confirm();
    } catch {
      return;
    }

    await deleteSuperAdminItem(entity, row._id, row.team);
    await load();
  };

  const onAddClick = async () => {
    try {
      setFormExtraProps((await resolveFormExtraProps?.(team)) ?? {});
    } catch {
      enqueueSnackbar("Failed to load data", { variant: "error" });
      return;
    }

    setFormOpen(true);
  };

  const onEditRowClick = async (row: any) => {
    try {
      setFormExtraProps((await resolveFormExtraProps?.(row.team)) ?? {});
    } catch {
      enqueueSnackbar("Failed to load data", { variant: "error" });
      return;
    }

    onEditClick(getEditFormData(row), row._id);
  };

  const onSubmitOverride = async (data: any, submittedEditingId?: string) => {
    try {
      // Every super-admin form carries its own `team` field now, so it can move a row to a different team.
      if (submittedEditingId) {
        await updateSuperAdminItem(entity, { ...data, _id: submittedEditingId });
      } else {
        await createSuperAdminItem(entity, data);
      }
    } catch {
      enqueueSnackbar("Failed to save", { variant: "error" });
      return;
    }

    await load();
  };

  // These fit their own content instead of a 220px floor - short values.
  const FIT_CONTENT_FIELDS = new Set(["actions", "roles", "team"]);

  const withColumnSizing = (column: GridColDef): GridColDef => {
    if (!FIT_CONTENT_FIELDS.has(column.field)) {
      return { minWidth: 220, ...column };
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- deliberately dropping flex so this column can size to content instead
    const { flex, ...rest } = column;

    return rest;
  };

  const gridColumns: GridColDef[] = [
    ...columns.map(withColumnSizing),
    ...(team
      ? []
      : [withColumnSizing({ field: "team", headerName: "Team" })]),
    withColumnSizing({
      field: "actions",
      type: "actions",
      headerName: "Actions",
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon />}
          label="Edit"
          onClick={() => onEditRowClick(params.row)}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => onDeleteClick(params.row)}
        />,
      ],
    }),
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h4">{title}</Typography>

      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <FormControl sx={{ minWidth: 220 }}>
          <InputLabel id="super-admin-team-select-label">Team</InputLabel>
          <Select
            labelId="super-admin-team-select-label"
            label="Team"
            value={team}
            onChange={(event) => setTeam(event.target.value)}
          >
            <MenuItem value="">All teams</MenuItem>

            {TEAMS.map((teamOption) => (
              <MenuItem key={teamOption} value={teamOption}>
                {teamOption}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {allowAdd && <AddFab onClick={onAddClick} />}

      <Box
        sx={{
          width: "100%",
          marginBottom: allowAdd ? `${FAB_CONTENT_CLEARANCE}px` : 0,
        }}
      >
        <DataGrid
          autoHeight
          autosizeOnMount
          rows={rows}
          columns={gridColumns}
          getRowId={(row) => row._id}
          loading={loading}
          disableRowSelectionOnClick
          pageSizeOptions={[25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 50 } },
          }}
        />
      </Box>

      <FormComponent
        open={formOpen}
        onClose={onFormClose}
        // Default a new row's team to the grid's current filter; no-op when editing (already set).
        initialData={{
          ...formInitialData,
          team: (formInitialData as any).team || team,
        }}
        editingId={editingId}
        onSubmitOverride={onSubmitOverride}
        {...formExtraProps}
      />
    </Box>
  );
};

export default SuperAdminEntityGrid;
