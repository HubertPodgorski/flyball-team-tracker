import React, { useId, useState } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  ListSubheader,
  MenuItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import type { AnyFieldApi } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import { FormFieldProps } from "./utils";
import ClearableTextField from "./ClearableTextField";

const CM_PER_FOOT = 30.48;

interface OffsetOption {
  cm: number;
  label: string;
}

// Quarter-meter steps plus feet marks - two groups, not interleaved.
const CM_OFFSETS: OffsetOption[] = [25, 50, 75].map((cm) => ({
  cm,
  label: `${cm}cm`,
}));

const FOOT_OFFSETS: OffsetOption[] = [0.5, 1, 1.5, 2, 2.5, 3].map((feet) => ({
  cm: feet * CM_PER_FOOT,
  label: `${feet}ft`,
}));

const OFFSETS: OffsetOption[] = [...CM_OFFSETS, ...FOOT_OFFSETS];

type Sign = "+" | "-";

// Literal, not computed - "16m - 25cm" stays that, never becomes "15.75m".
const formatValue = (meters: number, sign: Sign, offsetCm: number): string => {
  if (offsetCm === 0) return `${meters}m`;

  const offset = OFFSETS.find(({ cm }) => cm === offsetCm);

  return `${meters}m ${sign} ${offset?.label ?? `${offsetCm}cm`}`;
};

// Loose match: lowercased, spaces stripped, "f" accepted as shorthand for "ft".
const normalizeOffsetText = (text: string): string => {
  const normalized = text.trim().toLowerCase().replace(/\s+/g, "");

  return /^\d+(\.\d+)?f$/.test(normalized) ? `${normalized}t` : normalized;
};

const parseValue = (
  value: string
): { meters: number; sign: Sign; offsetCm: number } | null => {
  // Tolerate comma decimals and extra whitespace, not just what the picker itself produces.
  const trimmed = value.trim().replace(/,/g, ".").replace(/\s+/g, "");

  const bareMatch = /^(\d+)m$/.exec(trimmed);

  if (bareMatch) {
    return { meters: Number(bareMatch[1]), sign: "+", offsetCm: 0 };
  }

  const offsetMatch = /^(\d+)m\s*([+-])\s*(.+)$/.exec(trimmed);

  if (!offsetMatch) return null;

  const normalizedOffsetText = normalizeOffsetText(offsetMatch[3]);
  const matchedOffset = OFFSETS.find(
    ({ label }) => normalizeOffsetText(label) === normalizedOffsetText
  );

  if (!matchedOffset) return null;

  return {
    meters: Number(offsetMatch[1]),
    sign: offsetMatch[2] as Sign,
    offsetCm: matchedOffset.cm,
  };
};

interface InnerProps {
  field: AnyFieldApi;
  label: string;
}

// Meter anchor +/- offset, time-picker style.
const FormStartingPositionFieldInner = ({ field, label }: InnerProps) => {
  const { t } = useTranslation();
  // Not `${label}-meters`/`${label}-offset` - aria-labelledby is a
  // space-separated list of ids, so an id built from label text containing
  // a space (e.g. "Starting position-meters") silently splits into two
  // bogus references and the Select ends up with no accessible name at all.
  const metersLabelId = useId();
  const offsetLabelId = useId();
  const value: string = field.state.value ?? "";
  const parsed = parseValue(value);

  // Fallback only - a parsed value's own sign wins once one exists.
  const [manualSign, setManualSign] = useState<Sign>("+");

  const meters = parsed?.meters ?? 0;
  const sign = parsed?.sign ?? manualSign;
  const offsetCm = parsed?.offsetCm ?? 0;

  const updateValue = (newMeters: number, newSign: Sign, newOffsetCm: number) => {
    field.handleChange(formatValue(newMeters, newSign, newOffsetCm));
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Box sx={{ display: "flex", gap: 1, width: "100%", alignItems: "center" }}>
        <FormControl sx={{ flex: 1 }}>
          <InputLabel id={metersLabelId}>{label}</InputLabel>
          <Select
            labelId={metersLabelId}
            label={label}
            value={meters}
            onChange={(event) => updateValue(Number(event.target.value), sign, offsetCm)}
          >
            {Array.from({ length: 21 }, (_, index) => (
              <MenuItem key={index} value={index}>
                {index}m
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <ToggleButtonGroup
          value={sign}
          exclusive
          size="small"
          onChange={(_event, newSign: Sign | null) => {
            if (!newSign) return;

            setManualSign(newSign);
            updateValue(meters, newSign, offsetCm);
          }}
        >
          <ToggleButton value="+">+</ToggleButton>
          <ToggleButton value="-">−</ToggleButton>
        </ToggleButtonGroup>

        <FormControl sx={{ flex: 1 }}>
          <InputLabel id={offsetLabelId}>{t("inputs.startingPosition.offset")}</InputLabel>
          <Select
            labelId={offsetLabelId}
            label={t("inputs.startingPosition.offset")}
            value={offsetCm}
            onChange={(event) => updateValue(meters, sign, Number(event.target.value))}
            MenuProps={{ sx: { maxHeight: "50vh" } }}
          >
            <MenuItem value={0}>—</MenuItem>

            <ListSubheader>{t("inputs.startingPosition.feet")}</ListSubheader>

            {FOOT_OFFSETS.map(({ cm, label: offsetLabel }) => (
              <MenuItem key={cm} value={cm}>
                {offsetLabel}
              </MenuItem>
            ))}

            <ListSubheader>{t("inputs.startingPosition.centimeters")}</ListSubheader>

            {CM_OFFSETS.map(({ cm, label: offsetLabel }) => (
              <MenuItem key={cm} value={cm}>
                {offsetLabel}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <ClearableTextField
        value={value}
        onChange={(newValue) => field.handleChange(newValue)}
        onBlur={field.handleBlur}
        placeholder={t("inputs.startingPosition.placeholder")}
        size="small"
      />
    </Box>
  );
};

const FormStartingPositionField = ({ form, name, label }: FormFieldProps & { label: string }) => (
  <form.Field name={name}>
    {(field: AnyFieldApi) => <FormStartingPositionFieldInner field={field} label={label} />}
  </form.Field>
);

export default FormStartingPositionField;
