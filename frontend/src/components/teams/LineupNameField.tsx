import React, { useEffect, useState } from "react";
import { Lineup } from "../../helpers/types";
import ClearableTextField from "../inputs/ClearableTextField";

interface Props {
  lineup: Lineup;
  onSave: (name: string) => void;
}

const LineupNameField = ({ lineup, onSave }: Props) => {
  const [draft, setDraft] = useState(lineup.name ?? "");

  useEffect(() => {
    setDraft(lineup.name ?? "");
  }, [lineup.name]);

  const onBlur = () => {
    if (draft.trim() !== (lineup.name ?? "")) {
      onSave(draft.trim());
    } else {
      setDraft(lineup.name ?? "");
    }
  };

  return (
    <ClearableTextField
      value={draft}
      onChange={setDraft}
      onClear={() => {
        setDraft("");
        onSave("");
      }}
      onBlur={onBlur}
      onClick={(event) => event.stopPropagation()}
      label="Lineup name"
      size="small"
      sx={{ flexGrow: 1 }}
    />
  );
};

export default LineupNameField;
