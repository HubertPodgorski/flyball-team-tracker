import React from "react";
import { Box, Button, styled, useTheme } from "@mui/material";
import { Draggable } from "@hello-pangea/dnd";
import OpenWithIcon from "@mui/icons-material/OpenWith";

const WrapperStyled = styled(Box)(({ theme }) => ({
  display: "grid",
  gridGap: theme.spacing(2),
  gridTemplateColumns: "1fr 1fr",
  borderRadius: "6px",
  padding: theme.spacing(1),

  [theme.breakpoints.down("md")]: {
    gridGap: theme.spacing(1),
    padding: theme.spacing(0.5),
  },
}));

const TasksRow = ({ children, rowIndex, userPanel, adminPanel }) => {
  const theme = useTheme();

  if (adminPanel)
    return (
      <Draggable draggableId={`row-${rowIndex}`} index={+rowIndex} type="row">
        {({ draggableProps, dragHandleProps, innerRef }) => (
          <WrapperStyled
            {...draggableProps}
            ref={innerRef}
            sx={{
              gridRow: `${Number(rowIndex) + 1} / ${Number(rowIndex) + 2}`,
              border: userPanel ? "1px solid #ddd" : "none",
              position: "relative",
              paddingTop: theme.spacing(4),
              marginBottom: theme.spacing(0.5),
              [theme.breakpoints.down("md")]: {
                paddingTop: theme.spacing(4),
              },
            }}
          >
            <Box {...dragHandleProps}>
              <Button
                component={Box}
                onClick={(event) => event.preventDefault()}
                sx={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                }}
                variant="outlined"
                color="info"
              >
                <OpenWithIcon />
              </Button>
            </Box>

            {children}
          </WrapperStyled>
        )}
      </Draggable>
    );

  return (
    <WrapperStyled
      sx={{
        gridRow: `${Number(rowIndex) + 1} / ${Number(rowIndex) + 2}`,
        border: userPanel ? "1px solid #ddd" : "none",
      }}
    >
      {children}
    </WrapperStyled>
  );
};

export default TasksRow;
