import { AccordionSummary, styled } from "@mui/material";

// Locks minHeight so expanding doesn't grow the bar.
const FixedHeightAccordionSummary = styled(AccordionSummary)({
  minHeight: 48,
  "&.Mui-expanded": {
    minHeight: 48,
  },
  "& .MuiAccordionSummary-content.Mui-expanded": {
    margin: "12px 0",
  },
});

export default FixedHeightAccordionSummary;
