import { enUS, plPL } from "@mui/x-data-grid/locales";
import type { GridLocaleText } from "@mui/x-data-grid";

export const getDataGridLocaleText = (language: string): Partial<GridLocaleText> =>
  (language === "pl" ? plPL : enUS).components.MuiDataGrid.defaultProps.localeText;
