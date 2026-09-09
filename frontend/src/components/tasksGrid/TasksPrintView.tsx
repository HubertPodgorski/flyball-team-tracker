import React, { Fragment } from "react";
import { Box, Divider, ThemeProvider, Typography } from "@mui/material";
import { format } from "date-fns";
import { pl } from "date-fns/locale/pl";
import { enUS } from "date-fns/locale/en-US";
import { useTranslation } from "react-i18next";
import TasksMainGrid from "./TasksMainGrid";
import TasksRow from "./TasksRow";
import TasksColumn from "./TasksColumn";
import DogsTaskCell from "../DogsTaskCell";
import { useGetMappedTasks } from "../../hooks/useGetMappedTasks";
import printTheme from "../../helpers/printTheme";
import { Task } from "../../helpers/types";

// The hook itself is untyped JS (see useGetMappedTasks.js / helpers/tasks.js's mapTasks) - this is its real shape.
type MappedTasks = Record<string, Record<string, Task[]>>;

// Mounted only for an actual print (see Tasks.jsx) - light theme (app is dark-only); no title/legend, see index.css.
const TasksPrintView = () => {
  const { i18n } = useTranslation();
  const dateLocale = i18n.language === "en" ? enUS : pl;
  const { mappedTasks } = useGetMappedTasks() as { mappedTasks: MappedTasks };

  return (
    <Box className="print-area" sx={{ display: "none" }}>
      <ThemeProvider theme={printTheme}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {format(new Date(), "PPP", { locale: dateLocale })}
          </Typography>

          <TasksMainGrid>
            {Object.entries(mappedTasks).map(([rowIndex, columns], rowPosition) => (
              // A plain Divider between rows, not each row boxed in its own bordered card - see TasksRow's noBorder.
              <Fragment key={rowIndex}>
                {rowPosition > 0 && <Divider />}

                <TasksRow userPanel noBorder>
                  {Object.entries(columns).map(([columnIndex, items]) => (
                    <TasksColumn columnIndex={columnIndex} key={columnIndex}>
                      {items.map((item, index) => (
                        <DogsTaskCell item={item} key={item._id} index={index} />
                      ))}
                    </TasksColumn>
                  ))}
                </TasksRow>
              </Fragment>
            ))}
          </TasksMainGrid>
        </Box>
      </ThemeProvider>
    </Box>
  );
};

export default TasksPrintView;
