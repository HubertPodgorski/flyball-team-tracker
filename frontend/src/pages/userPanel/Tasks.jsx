import React from "react";
import { Box } from "@mui/material";
import TasksMainGrid from "../../components/tasksGrid/TasksMainGrid";
import TasksRow from "../../components/tasksGrid/TasksRow";
import TasksColumn from "../../components/tasksGrid/TasksColumn";
import { useGetMappedTasks } from "../../hooks/useGetMappedTasks";
import DogsTaskCell from "../../components/DogsTaskCell";
import LineupTaskLegend from "../../components/LineupTaskLegend";

const Tasks = () => {
  const { mappedTasks } = useGetMappedTasks();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <LineupTaskLegend />

      <TasksMainGrid>
        {Object.entries(mappedTasks).map(([rowIndex, columns]) => (
          <TasksRow key={rowIndex} userPanel>
            {Object.entries(columns).map(([columnIndex, items]) => (
              <TasksColumn columnIndex={columnIndex} key={columnIndex}>
                {items.map((item, index) => (
                  <DogsTaskCell item={item} key={item._id} index={index} />
                ))}
              </TasksColumn>
            ))}
          </TasksRow>
        ))}
      </TasksMainGrid>
    </Box>
  );
};

export default Tasks;
