import React, { useEffect, useState } from "react";
import { Button, DialogActions, Stack, TextField } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { useTranslation } from "react-i18next";
import Modal from "./modals/Modal";
import { EjsCompetition } from "../helpers/types";
import { useCreateEjsEventMutation, useUpdateEjsEventMutation } from "../queries/competitions";

interface Props {
  open: boolean;
  onClose: () => void;
  // When set, edits this competition; otherwise creates a new one. It has no club - purely a shared EJS placeholder.
  competition?: EjsCompetition;
  onSaved: (eventId: string) => void;
}

// Super-admin only. A club-less Event - just enough (name, date range) to hang EJS imports off of, nothing a real
// club calendar needs (type, team, recurrence). Used both by the import wizard's "create competition" step and by
// EJS Stats' own "Edit competition" action - it has no calendar page of its own to edit it from.
const EjsCompetitionEventDialog = ({ open, onClose, competition, onSaved }: Props) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [date, setDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const createMutation = useCreateEjsEventMutation();
  const updateMutation = useUpdateEjsEventMutation();

  useEffect(() => {
    if (!open) return;

    setName(competition?.name ?? "");
    setDate(competition?.date ? new Date(competition.date) : new Date());
    setEndDate(competition?.endDate ? new Date(competition.endDate) : null);
  }, [open, competition]);

  const saving = createMutation.isPending || updateMutation.isPending;
  const canSave = !!name.trim() && !!date;

  const onSave = () => {
    if (!canSave || !date) return;

    const input = { name: name.trim(), date, endDate };

    if (competition) {
      updateMutation.mutate(
        { eventId: competition._id, input },
        { onSuccess: () => { onSaved(competition._id); onClose(); } }
      );
    } else {
      createMutation.mutate(input, { onSuccess: (created) => { onSaved(created._id); onClose(); } });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={competition ? t("pages.ejsStats.wizard.editCompetitionTitle") : t("pages.ejsStats.wizard.newCompetitionTitle")}
    >
      <Stack sx={{ gap: 2 }}>
        <TextField
          label={t("common.name")}
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoFocus
          fullWidth
        />
        <DatePicker label={t("forms.event.startDate")} value={date} onChange={setDate} />
        <DatePicker
          label={t("forms.event.endDate")}
          value={endDate}
          onChange={setEndDate}
          minDate={date ?? undefined}
          slotProps={{ field: { clearable: true } }}
        />
      </Stack>

      <DialogActions sx={{ paddingX: 0 }}>
        <Button onClick={onClose}>{t("common.cancel")}</Button>
        <Button variant="contained" loading={saving} disabled={!canSave} onClick={onSave}>
          {t("common.save")}
        </Button>
      </DialogActions>
    </Modal>
  );
};

export default EjsCompetitionEventDialog;
