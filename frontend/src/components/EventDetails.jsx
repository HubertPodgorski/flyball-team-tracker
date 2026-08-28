import React, { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  alpha,
  Button,
  Chip,
  Typography,
  useTheme,
} from "@mui/material";
import ChipsGrid from "./ChipsGrid";
import ButtonsGrid from "./ButtonsGrid";
import { useAppContext } from "../hooks/useAppContext";
import { useAuthContext } from "../hooks/useAuthContext";
import { useIsMobile } from "../hooks/useIsMobile";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { getColorsByStatus, sortByAttendance } from "../helpers/calendar";
import { useSocketContext } from "../hooks/useSocketContext";
import DogAttendanceChips from "./DogAttendanceChips";

const EventDetails = ({ users, dogs, id }) => {
  const theme = useTheme();

  const [detailsOpen, setDetailsOpen] = useState(false);

  const { dogs: allDogs, users: allUsers } = useAppContext();
  const { user } = useAuthContext();
  const { socket } = useSocketContext();

  const isMobile = useIsMobile();

  const usersWithAttendance = allUsers.map((user) => {
    const userFound = users.find(
      ({ _id: currentEventUserId }) => currentEventUserId === user._id
    );

    if (!userFound || !userFound.status) return user;

    return { ...user, status: userFound.status };
  });

  const dogsWithAttendance = allDogs.map((dog) => {
    const dogFound = dogs.find(
      ({ _id: currentEventDogId }) => currentEventDogId === dog._id
    );

    if (!dogFound || !dogFound.status) return dog;

    return { ...dog, status: dogFound.status };
  });

  const onDogPresenceUpdateClick = (dogId) => {
    socket.emit("toggle_event_dog", { dogId, _id: id });
  };

  const onUserPresenceUpdateClick = () => {
    socket.emit("toggle_event_user", { userId: user._id, _id: id });
  };

  const onDetailsOpenChange = () => {
    setDetailsOpen(!detailsOpen);
  };

  const sortedUsersByAttendance = usersWithAttendance.sort(sortByAttendance);

  const getUserButtonColorById = (_id) => {
    const defaultColor = "warning";

    const userFound = users.find(
      ({ _id: currentEventUserId }) => currentEventUserId === _id
    );

    if (!userFound) return defaultColor;

    if (userFound?.status === "PRESENT") return "success";

    if (userFound?.status === "ABSENT") return "error";

    return defaultColor;
  };

  const getDogButtonColorById = (_id) => {
    const defaultColor = "warning";

    const dogFound = dogs.find(({ _id: currentDogId }) => currentDogId === _id);

    if (!dogFound) return defaultColor;

    if (dogFound?.status === "PRESENT") return "success";

    if (dogFound?.status === "ABSENT") return "error";

    return defaultColor;
  };

  return (
    <Accordion
      TransitionProps={{ unmountOnExit: true, mountOnEnter: true }}
      expanded={detailsOpen}
      onChange={onDetailsOpenChange}
      disableGutters
      sx={{
        background: alpha("#333", 0.75),
        backdropFilter: "blur(6px)",
        padding: theme.spacing(1),
        boxShadow: "none",
        ".MuiAccordionDetails-root": {
          padding: 0,
        },
        ".MuiAccordionSummary-root": {
          minHeight: 0,
          padding: 0,
        },
        ".MuiAccordionSummary-content": {
          margin: 0,
        },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>{detailsOpen ? "Hide" : "Show"} details</Typography>
      </AccordionSummary>

      <AccordionDetails
        sx={{
          display: "grid",
          gridAutoFlow: "rows",
          gridGap: theme.spacing(2),

          [theme.breakpoints.down("md")]: {
            gridGap: theme.spacing(1),
          },
        }}
      >
        <DogAttendanceChips dogsWithAttendance={dogsWithAttendance} />

        <ChipsGrid people>
          {sortedUsersByAttendance.map(({ name, _id, status }) => {
            const { color, background } = getColorsByStatus(status);

            return (
              <Chip
                label={name}
                key={_id}
                sx={{
                  background,
                  color,
                }}
              />
            );
          })}
        </ChipsGrid>

        <Typography variant={isMobile ? "body2" : "body1"}>
          Select dog{user.dogs.length > 1 ? "s" : ""} attendance
        </Typography>

        {user.dogs.length > 0 && (
          <ButtonsGrid sx={{ justifyContent: "flex-start" }}>
            {user.dogs.map(({ _id: dogId, name }) => (
              <Button
                variant="contained"
                key={dogId}
                color={getDogButtonColorById(dogId)}
                onClick={() => onDogPresenceUpdateClick(dogId)}
                sx={{ minWidth: "150px" }}
              >
                {name}
              </Button>
            ))}
          </ButtonsGrid>
        )}

        <Typography variant={isMobile ? "body2" : "body1"}>
          Select my attendance
        </Typography>

        <ButtonsGrid sx={{ justifyContent: "flex-start" }}>
          <Button
            variant="contained"
            color={getUserButtonColorById(user._id)}
            onClick={() => onUserPresenceUpdateClick()}
            sx={{ minWidth: "150px" }}
          >
            {user.name}
          </Button>
        </ButtonsGrid>
      </AccordionDetails>
    </Accordion>
  );
};

export default EventDetails;
