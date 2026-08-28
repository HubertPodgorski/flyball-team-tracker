import React from "react";
import { Box, styled } from "@mui/material";

const WrapperStyled = styled(Box)(({ theme }) => ({
  display: "grid",
  gridAutoFlow: "row",
  gridAutoRows: "auto",
  gridGap: 16,
  maxWidth: 500,
  padding: theme.spacing(1, 0),
}));

const FormGrid = React.forwardRef(({ children }, ref) => (
  <WrapperStyled ref={ref}>{children}</WrapperStyled>
));

FormGrid.displayName = "FormGrid";

export default FormGrid;
