import React from "react";
import { Box, Button, styled, useTheme } from "@mui/material";
import { Draggable } from "@hello-pangea/dnd";
import OpenWithIcon from "@mui/icons-material/OpenWith";

const ColumnsStyled = styled(Box, {
  shouldForwardProp: (prop) => prop !== "userPanel",
})(({ theme, userPanel }) => ({
  display: "grid",
  // Admin columns touch (no gap); the user-facing board keeps an 8px gap
  // between them. Computed here, together with its breakpoint override, so
  // there's a single source of truth instead of an sx prop trying to win a
  // specificity fight against this same component's own media query.
  gridGap: userPanel ? "8px" : 0,
  gridTemplateColumns: "1fr 1fr",
  borderRadius: "6px",
  padding: theme.spacing(1),

  [theme.breakpoints.down("md")]: {
    gridGap: userPanel ? "8px" : 0,
    padding: userPanel ? theme.spacing(1) : 0,
  },
}));

const TasksRow = ({ children, rowIndex, userPanel, adminPanel }) => {
  const theme = useTheme();

  if (adminPanel)
    return (
      <Draggable draggableId={`row-${rowIndex}`} index={+rowIndex} type="row">
        {({ draggableProps, dragHandleProps, innerRef }) => (
          <Box
            {...draggableProps}
            ref={innerRef}
            sx={{
              display: "flex",
              flexDirection: "column",
              border: userPanel ? `1px solid ${theme.palette.secondary.main}` : "none",
              borderRadius: "6px",
              marginBottom: theme.spacing(0.5),
            }}
          >
            <Box {...dragHandleProps}>
              <Button
                component={Box}
                nativeButton={false}
                disableRipple
                onClick={(event) => event.preventDefault()}
                sx={{
                  width: "100%",
                  borderColor: theme.palette.secondary.main,
                  borderBottom: "none",
                  borderTopLeftRadius: "6px",
                  borderTopRightRadius: "6px",
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                }}
                variant="outlined"
                color="info"
              >
                <OpenWithIcon />
              </Button>
            </Box>

            <ColumnsStyled>{children}</ColumnsStyled>
          </Box>
        )}
      </Draggable>
    );

  return (
    <ColumnsStyled
      userPanel={userPanel}
      sx={{
        border: userPanel ? `1px solid ${theme.palette.secondary.main}` : "none",
      }}
    >
      {children}
    </ColumnsStyled>
  );
};

export default TasksRow;
