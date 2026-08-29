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
  const [editingRow, setEditingRow] = useState<any>();
  const [formExtraProps, setFormExtraProps] = useState<object>({});
  const confirm = useConfirmModal();

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
    setEditingRow(undefined);
    setFormExtraProps((await resolveFormExtraProps?.(team)) ?? {});
    setFormOpen(true);
  };

  const onEditRowClick = async (row: any) => {
    setEditingRow(row);
    setFormExtraProps((await resolveFormExtraProps?.(row.team)) ?? {});
    onEditClick(getEditFormData(row), row._id);
  };

  const onSubmitOverride = async (data: object, submittedEditingId?: string) => {
    if (submittedEditingId) {
      await updateSuperAdminItem(entity, {
        ...data,
        _id: submittedEditingId,
        team: editingRow.team,
      });
    } else {
      await createSuperAdminItem(entity, { ...data, team });
    }

    await load();
  };

  const gridColumns: GridColDef[] = [
    ...columns,
    ...(team
      ? []
      : [{ field: "team", headerName: "Team", flex: 1 } as GridColDef]),
    {
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
    },
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

      {allowAdd && <AddFab disabled={!team} onClick={onAddClick} />}

      <Box
        sx={{
          width: "100%",
          marginBottom: allowAdd ? `${FAB_CONTENT_CLEARANCE}px` : 0,
        }}
      >
        <DataGrid
          autoHeight
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
        initialData={formInitialData}
        editingId={editingId}
        onSubmitOverride={onSubmitOverride}
        {...formExtraProps}
      />
    </Box>
  );
};

export default SuperAdminEntityGrid;
