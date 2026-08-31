export interface SelectOption {
  value: string;
  label: string;
  // Optional MUI palette color key - colors this option's chip in FormSelect.
  color?: "success" | "warning" | "error";
}
