// A starting position is a metre anchor plus an optional +/- offset ("16m", "16m - 25cm", "16m + 1ft").
// Kept as pure functions so FormStartingPositionField stays thin and this stays unit-tested.

const CM_PER_FOOT = 30.48;

export interface OffsetOption {
  cm: number;
  label: string;
}

const CM_OFFSETS: OffsetOption[] = [25, 50, 75].map((cm) => ({ cm, label: `${cm}cm` }));

const FOOT_OFFSETS: OffsetOption[] = [0.5, 1, 1.5, 2, 2.5, 3].map((feet) => ({
  cm: feet * CM_PER_FOOT,
  label: `${feet}ft`,
}));

export const OFFSETS: OffsetOption[] = [...CM_OFFSETS, ...FOOT_OFFSETS];
export { CM_OFFSETS, FOOT_OFFSETS };

export type Sign = "+" | "-";

// Literal, not computed - "16m - 25cm" stays that, never becomes "15.75m".
// A sign with no offset carries no information, so it's dropped there.
export const formatValue = (meters: number, sign: Sign, offsetCm: number): string => {
  if (offsetCm === 0) return `${meters}m`;

  const offset = OFFSETS.find(({ cm }) => cm === offsetCm);

  return `${meters}m ${sign} ${offset?.label ?? `${offsetCm}cm`}`;
};

// Loose match: lowercased, spaces stripped, "f" accepted as shorthand for "ft".
export const normalizeOffsetText = (text: string): string => {
  const normalized = text.trim().toLowerCase().replace(/\s+/g, "");

  return /^\d+(\.\d+)?f$/.test(normalized) ? `${normalized}t` : normalized;
};

// sign is null for a bare "16m" - it genuinely has no sign, so callers fall back to whatever the user last picked
// rather than pinning the toggle to "+".
export const parseValue = (
  value: string
): { meters: number; sign: Sign | null; offsetCm: number } | null => {
  // Tolerate comma decimals and extra whitespace, not just what the picker itself produces.
  const trimmed = value.trim().replace(/,/g, ".").replace(/\s+/g, "");

  const bareMatch = /^(\d+)m$/.exec(trimmed);

  if (bareMatch) {
    return { meters: Number(bareMatch[1]), sign: null, offsetCm: 0 };
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
