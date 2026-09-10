import React, { useRef, useState } from "react";
import {
  Box,
  Button,
  DialogActions,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import Modal from "./modals/Modal";
import { EventType } from "./inputs/consts";
import EventForm from "../pages/forms/EventForm";
import { EjsPreviewResult, Event } from "../helpers/types";
import { competitionOptionLabel } from "../helpers/competitionOptionLabel";
import { useEventsQuery } from "../queries/events";
import { getCurrentClub } from "../helpers/authToken";
import { usePreviewEjsImportMutation, useConfirmEjsImportMutation } from "../queries/competitions";

interface Props {
  open: boolean;
  onClose: () => void;
  // Lets the caller select the just-imported competition for viewing.
  onImported?: (eventId: string) => void;
}

const EjsImportWizard = ({ open, onClose, onImported }: Props) => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const { data: events = [] } = useEventsQuery();
  const previewMutation = usePreviewEjsImportMutation();
  const confirmMutation = useConfirmEjsImportMutation();

  const [activeStep, setActiveStep] = useState(0);
  const [eventId, setEventId] = useState("");
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const knownCompetitionIds = useRef<Set<string>>(new Set());
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<EjsPreviewResult | null>(null);

  const competitionEvents = events.filter((event) => event.type === EventType.COMPETITION);

  const reset = () => {
    setActiveStep(0);
    setEventId("");
    setFiles([]);
    setPreview(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const openEventForm = () => {
    knownCompetitionIds.current = new Set(competitionEvents.map((event) => event._id));
    setEventFormOpen(true);
  };

  // EventForm creates via its own mutation and just closes - pick up whichever COMPETITION event is new (nothing new = it was cancelled).
  const onEventFormClose = async () => {
    setEventFormOpen(false);
    await queryClient.refetchQueries({ queryKey: ["events"] });

    const fresh = (queryClient.getQueryData(["events", getCurrentClub()]) ?? []) as Event[];
    const created = fresh.find(
      (event) => event.type === EventType.COMPETITION && !knownCompetitionIds.current.has(event._id)
    );

    if (created) setEventId(created._id);
  };

  const onAnalyzeFiles = () => {
    previewMutation.mutate(
      { eventId, files },
      {
        onSuccess: setPreview,
        onError: () => enqueueSnackbar(t("pages.ejsStats.parseFailed"), { variant: "error" }),
      }
    );
  };

  const onStartImport = () => {
    confirmMutation.mutate(
      { eventId, files },
      {
        onSuccess: ({ count }) => {
          enqueueSnackbar(t("pages.ejsStats.importSuccess", { count }), { variant: "success" });
          queryClient.invalidateQueries({ queryKey: ["ejsCompetitions"] });
          queryClient.invalidateQueries({ queryKey: ["competitionStats", eventId] });
          queryClient.invalidateQueries({ queryKey: ["competitionTeamMapping", eventId] });
          onImported?.(eventId);
          close();
        },
        onError: () => enqueueSnackbar(t("pages.ejsStats.importFailed"), { variant: "error" }),
      }
    );
  };

  const steps = [
    t("pages.ejsStats.wizard.stepEvent"),
    t("pages.ejsStats.wizard.stepFiles"),
    t("pages.ejsStats.wizard.stepImport"),
  ];

  const canContinue = (activeStep === 0 && !!eventId) || (activeStep === 1 && !!preview);
  const isLastStep = activeStep === steps.length - 1;

  return (
    <Modal open={open} onClose={close} title={t("pages.ejsStats.wizard.title")}>
      <Stack sx={{ gap: 2 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && (
          <Stack sx={{ gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="wizard-event-label">{t("pages.ejsStats.wizard.pickCompetition")}</InputLabel>
              <Select
                labelId="wizard-event-label"
                label={t("pages.ejsStats.wizard.pickCompetition")}
                value={eventId}
                onChange={(event) => setEventId(event.target.value)}
              >
                {competitionEvents.map((event) => (
                  <MenuItem key={event._id} value={event._id}>
                    {competitionOptionLabel(event)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography variant="body2" color="text.secondary">
              {t("pages.ejsStats.wizard.orCreate")}
            </Typography>

            <Button variant="outlined" sx={{ alignSelf: "flex-start" }} onClick={openEventForm}>
              {t("pages.ejsStats.wizard.newCompetition")}
            </Button>
          </Stack>
        )}

        {activeStep === 1 && (
          <Stack sx={{ gap: 2 }}>
            <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} sx={{ alignSelf: "flex-start" }}>
              {files.length > 0 ? t("pages.ejsStats.filesChosen", { count: files.length }) : t("pages.ejsStats.chooseFiles")}
              <input
                type="file"
                hidden
                multiple
                accept=".xls,.xlsx"
                onChange={(event) => {
                  setFiles(event.target.files ? Array.from(event.target.files) : []);
                  setPreview(null);
                }}
              />
            </Button>

            <Button
              variant="contained"
              sx={{ alignSelf: "flex-start" }}
              disabled={files.length === 0}
              loading={previewMutation.isPending}
              onClick={onAnalyzeFiles}
            >
              {t("pages.ejsStats.wizard.analyzeFiles")}
            </Button>

            {preview && (
              <Stack sx={{ gap: 0.5 }}>
                <Typography variant="body2" color="success.main">
                  {t("pages.ejsStats.wizard.rowsFound", { count: preview.rowCount })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("pages.ejsStats.wizard.teamsFound", { teams: preview.teamNames.join(", ") })}
                </Typography>
              </Stack>
            )}
          </Stack>
        )}

        {activeStep === 2 && (
          <Stack sx={{ gap: 1 }}>
            <Typography variant="body2">
              {t("pages.ejsStats.wizard.reviewSummary", {
                rows: preview?.rowCount ?? 0,
                teams: preview?.teamNames.length ?? 0,
              })}
            </Typography>
            <Typography variant="caption" color="warning.main">
              {t("pages.ejsStats.confirmReplacesAllWarning")}
            </Typography>
          </Stack>
        )}
      </Stack>

      <DialogActions sx={{ paddingX: 0 }}>
        <Button onClick={close}>{t("common.cancel")}</Button>
        <Box sx={{ flexGrow: 1 }} />
        {activeStep > 0 && (
          <Button onClick={() => setActiveStep((step) => step - 1)}>{t("pages.ejsStats.wizard.back")}</Button>
        )}
        {isLastStep ? (
          <Button variant="contained" loading={confirmMutation.isPending} onClick={onStartImport}>
            {t("pages.ejsStats.wizard.startImport")}
          </Button>
        ) : (
          <Button variant="contained" disabled={!canContinue} onClick={() => setActiveStep((step) => step + 1)}>
            {t("pages.ejsStats.wizard.next")}
          </Button>
        )}
      </DialogActions>

      <EventForm
        open={eventFormOpen}
        onClose={onEventFormClose}
        initialData={{ name: "", date: new Date(), type: EventType.COMPETITION }}
      />
    </Modal>
  );
};

export default EjsImportWizard;
