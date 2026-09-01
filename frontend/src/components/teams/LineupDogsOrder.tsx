import React, { useEffect, useState } from "react";
import { ReactSortable, type ItemInterface } from "react-sortablejs";
import { Box, Typography, styled } from "@mui/material";
import OpenWithIcon from "@mui/icons-material/OpenWith";
import { Dog } from "../../helpers/types";

// Info color, distinct from the cross-pass table's orange.
const DogRowStyled = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  border: `1px solid ${theme.palette.info.main}`,
  borderRadius: "6px",
  cursor: "grab",
}));

const toItems = (dogs: Dog[]): ItemInterface[] => dogs.map(({ _id }) => ({ id: _id }));

interface Props {
  dogs: Dog[];
  editable: boolean;
  onChange: (dogs: Dog[]) => void;
}

// Drives the cross-pass chain below (LineupCrossPasses).
const LineupDogsOrder = ({ dogs, editable, onChange }: Props) => {
  const [items, setItems] = useState<ItemInterface[]>(() => toItems(dogs));

  useEffect(() => {
    setItems(toItems(dogs));
  }, [dogs]);

  // Read-only viewers already see the order in LineupAccordion's summary.
  if (!editable) return null;

  return (
    <ReactSortable
      list={items}
      setList={(newItems) => {
        setItems(newItems);

        const reordered = newItems
          .map(({ id }) => dogs.find(({ _id }) => _id === id))
          .filter((dog): dog is Dog => !!dog);

        onChange(reordered);
      }}
      animation={150}
      forceFallback
      style={{ display: "flex", flexDirection: "column", gap: "4px" }}
    >
      {items.map((item, index) => {
        const dog = dogs.find(({ _id }) => _id === item.id);

        if (!dog) return null;

        return (
          <DogRowStyled key={dog._id}>
            <OpenWithIcon fontSize="small" />
            <Typography>
              {index + 1}. {dog.name}
            </Typography>
          </DogRowStyled>
        );
      })}
    </ReactSortable>
  );
};

export default LineupDogsOrder;
