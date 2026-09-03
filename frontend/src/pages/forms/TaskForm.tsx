import { useEffect, useState } from "react";
import {
  Box,
  Button,
  DialogActions,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  styled,
} from "@mui/material";
import { ReactSortable, type ItemInterface } from "react-sortablejs";
import OpenWithIcon from "@mui/icons-material/OpenWith";
import { useForm, useStore } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import type { AnyFieldApi } from "@tanstack/react-form";
import FormModal from "../../components/FormModal";
import FormGrid from "../../components/FormGrid";
import FormSelect from "../../components/inputs/FormSelect";
import type { AnyReactFormApi } from "../../components/inputs/utils";
import { useDogsQuery } from "../../queries/dogs";
import { CreateEditTaskFormType, CreateEditTaskRequestType } from "./types";
import { LineupCrossPass, LineupRef, Position, Task } from "../../helpers/types";
import FormTextSelect from "../../components/inputs/FormTextSelect";
import { useCreateTaskMutation, useUpdateTaskMutation } from "../../queries/tasks";
import { useSubmitGuard } from "../../hooks/useSubmitGuard";
import { useDogsWithAttendance } from "../../hooks/useDogsWithAttendance";
import { useTaskPlanningContext } from "../../hooks/useTaskPlanningContext";
import { getDogPlanningColor } from "../../helpers/calendar";
import { resolveDogsByIds } from "../../helpers/dogs";
import { useTeamsQuery, useUpdateTeamMutation } from "../../queries/teams";
import { useDogTasksQuery } from "../../queries/dogTasks";
import { withLineupCrossPasses } from "../../helpers/lineupLink";
import { getLineupJumpHeight } from "../../helpers/lineup";
import DogChain from "../../components/teams/DogChain";
import LineupCrossPasses from "../../components/teams/LineupCrossPasses";

interface DogOrderItem extends ItemInterface {
  name: string;
}

const DogOrderRowStyled = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  border: `1px solid ${theme.palette.secondary.main}`,
  borderRadius: "6px",
  cursor: "grab",
}));

// Reorders the same `dogs` field FormSelect writes to - doesn't pick dogs.
const DogsOrderField = ({ form }: { form: AnyReactFormApi }) => {
  const { t } = useTranslation();
  const { data: dogs = [] } = useDogsQuery();

  return (
    <form.Field name="dogs">
      {(field: AnyFieldApi) => {
        const selectedIds: string[] = field.state.value ?? [];

        if (selectedIds.length < 2) return null;

        const items: DogOrderItem[] = selectedIds
          .map((id) => dogs.find((dog) => dog._id === id))
          .filter((dog): dog is (typeof dogs)[number] => !!dog)
          .map((dog) => ({ id: dog._id, name: dog.name }));

        return (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t("forms.task.setDogsOrder")}
            </Typography>

            <ReactSortable
              list={items}
              setList={(newItems: DogOrderItem[]) =>
                field.handleChange(newItems.map((item) => item.id))
              }
              animation={150}
              forceFallback
              fallbackOnBody
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              {items.map((item) => (
                <DogOrderRowStyled key={item.id}>
                  <OpenWithIcon fontSize="small" />
                  <Typography>{item.name}</Typography>
                </DogOrderRowStyled>
              ))}
            </ReactSortable>
          </Box>
        );
      }}
    </form.Field>
  );
};

// Independent of the Dogs field - see resolveSubmitDogs.
const TeamLineupPicker = ({ form, matchupRef }: { form: AnyReactFormApi; matchupRef?: LineupRef }) => {
  const { t } = useTranslation();
  const { data: teams = [] } = useTeamsQuery();
  const updateTeamMutation = useUpdateTeamMutation();
  const [teamId, setTeamId] = useState(matchupRef?.squadId ?? "");

  if (teams.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary">
        {t("forms.task.noTeams")}
      </Typography>
    );
  }

  const team = teams.find(({ _id }) => _id === teamId);
  const lineup =
    team && matchupRef?.squadId === team._id
      ? team.matchups.find(({ _id }) => _id === matchupRef.matchupId)
      : undefined;

  const onTeamChange = (newTeamId: string) => {
    setTeamId(newTeamId);
    form.setFieldValue("matchupRef", undefined);
  };

  const onLineupChange = (lineupId: string) => {
    if (!team) return;

    form.setFieldValue("matchupRef", { squadId: team._id, matchupId: lineupId });
  };

  const onCrossPassesChange = (crossPasses: LineupCrossPass[]) => {
    if (!team || !lineup) return;

    updateTeamMutation.mutate(withLineupCrossPasses(team, lineup._id, crossPasses));
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <FormControl fullWidth>
        <InputLabel id="task-team-label">{t("common.team")}</InputLabel>
        <Select
          labelId="task-team-label"
          label={t("common.team")}
          value={teamId}
          onChange={(event) => onTeamChange(event.target.value)}
        >
          {teams.map((teamOption) => (
            <MenuItem key={teamOption._id} value={teamOption._id}>
              {teamOption.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {team && team.matchups.length === 0 && (
        <Typography variant="caption" color="text.secondary">
          {t("forms.task.noLineups")}
        </Typography>
      )}

      {team && team.matchups.length > 0 && (
        <FormControl fullWidth>
          <InputLabel id="task-lineup-label">{t("forms.task.lineup")}</InputLabel>
          <Select
            labelId="task-lineup-label"
            label={t("forms.task.lineup")}
            value={lineup?._id ?? ""}
            onChange={(event) => onLineupChange(event.target.value)}
          >
            {team.matchups.map((m) => {
              const label = m.name || m.dogs.map(({ name }) => name).join(", ");
              const jumpHeight = getLineupJumpHeight(m.dogs);

              return (
                <MenuItem key={m._id} value={m._id}>
                  {jumpHeight === undefined ? label : `${label} (${jumpHeight}cm)`}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      )}

      {lineup && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <DogChain dogs={lineup.dogs} />
          <LineupCrossPasses lineup={lineup} editable onChange={onCrossPassesChange} />
        </Box>
      )}
    </Box>
  );
};

interface Props {
  open: boolean;
  onClose: () => void;
  initialData: Task;
  editingId?: string;
  maxRowIndex?: number;
}

const mapToFormType = ({
  description,
  dogs,
  position,
  matchupRef,
}: Task): CreateEditTaskFormType => ({
  description,
  dogs: dogs.map(({ _id }) => _id),
  position,
  matchupRef,
});

const TaskForm = ({
  open,
  onClose,
  initialData,
  editingId,
  maxRowIndex,
}: Props) => {
  const { t } = useTranslation();
  const { data: dogs = [] } = useDogsQuery();
  const { data: dogTasks = [] } = useDogTasksQuery();
  const createTaskMutation = useCreateTaskMutation();
  const updateTaskMutation = useUpdateTaskMutation();
  const submitGuard = useSubmitGuard();
  const { selectedEventId } = useTaskPlanningContext();
  const dogsWithAttendance = useDogsWithAttendance(selectedEventId);
  const { data: teams = [] } = useTeamsQuery();

  const [mode, setMode] = useState<"dogs" | "team">(
    initialData.matchupRef ? "team" : "dogs"
  );

  useEffect(() => {
    setMode(initialData.matchupRef ? "team" : "dogs");
  }, [initialData]);

  const getPosition = (values: CreateEditTaskFormType): Position => {
    if (editingId) {
      return {
        ...values.position,
        rowIndex: values.position.rowIndex,
      };
    }

    if (maxRowIndex) {
      return {
        ...values.position,
        rowIndex: maxRowIndex,
      };
    }

    return values.position;
  };

  const resolveSubmitDogs = (values: CreateEditTaskFormType) => {
    if (mode === "team" && values.matchupRef) {
      const team = teams.find(({ _id }) => _id === values.matchupRef!.squadId);
      const lineup = team?.matchups.find(({ _id }) => _id === values.matchupRef!.matchupId);

      return lineup?.dogs ?? [];
    }

    return resolveDogsByIds(values.dogs, dogs);
  };

  const form = useForm({
    defaultValues: mapToFormType(initialData),
    onSubmit: async ({ value: values }) => {
      const data: CreateEditTaskRequestType = {
        description: values.description,
        dogs: resolveSubmitDogs(values),
        position: getPosition(values),
        matchupRef: mode === "team" ? values.matchupRef : undefined,
      };

      if (editingId) {
        updateTaskMutation.mutate(
          { ...data, _id: editingId },
          { onSuccess: handleClose }
        );
      } else {
        createTaskMutation.mutate(data, { onSuccess: handleClose });
      }
    },
  });

  useEffect(() => {
    form.reset(mapToFormType(initialData));
  }, [initialData, form]);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const dogTaskOptions = dogTasks.map(({ name }) => ({
    value: name,
    label: name,
  }));

  const dogOptions = dogs.map(({ name, _id }) => {
    const attendance = dogsWithAttendance.find(({ _id: dogId }) => dogId === _id);
    const color = attendance
      ? getDogPlanningColor(attendance.isPlanned, attendance.status)
      : null;

    return { value: _id, label: name, color: color ?? undefined };
  });

  const matchupRef = useStore(form.store, (state) => state.values.matchupRef);

  return (
    <FormModal
      onClose={handleClose}
      open={open}
      title={editingId ? t("forms.task.editTitle") : t("forms.task.addTitle")}
    >
      <FormGrid>
        <FormTextSelect
          form={form}
          label={t("forms.task.typeOrSelectDescription")}
          options={dogTaskOptions}
          name="description"
        />

        <Typography variant="body2" color="text.secondary">
          {t("forms.task.pickDogsHint")}
        </Typography>

        <ToggleButtonGroup
          value={mode}
          exclusive
          fullWidth
          onChange={(_event, newMode: "dogs" | "team" | null) => {
            if (newMode) setMode(newMode);
          }}
        >
          <ToggleButton value="dogs">{t("common.dogs")}</ToggleButton>
          <ToggleButton value="team">{t("forms.task.teamLineup")}</ToggleButton>
        </ToggleButtonGroup>

        {mode === "dogs" && (
          <>
            <FormSelect form={form} name="dogs" label={t("common.dogs")} options={dogOptions} />

            <DogsOrderField form={form} />
          </>
        )}

        {mode === "team" && <TeamLineupPicker form={form} matchupRef={matchupRef} />}

        <DialogActions sx={{ padding: 0 }}>
          <Button size="medium" variant="outlined" onClick={handleClose}>
            {t("common.cancel")}
          </Button>

          <Button
            size="medium"
            variant="contained"
            disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
            onClick={() => submitGuard(() => form.handleSubmit())}
          >
            {t("common.submit")}
          </Button>
        </DialogActions>
      </FormGrid>
    </FormModal>
  );
};

export default TaskForm;
