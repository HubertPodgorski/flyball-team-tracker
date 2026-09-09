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
import { useTranslation } from "react-i18next";
import ChipsGrid from "./ChipsGrid";
import ButtonsGrid from "./ButtonsGrid";
import { useDogsQuery } from "../queries/dogs";
import { useUsersQuery } from "../queries/users";
import { useToggleEventDogMutation, useToggleEventUserMutation } from "../queries/events";
import { useAuthContext } from "../hooks/useAuthContext";
import { useIsMobile } from "../hooks/useIsMobile";
import { useIsSuperAdmin } from "../hooks/useIsSuperAdmin";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { getAttendanceButtonProps, getColorsByStatus, sortByAttendance } from "../helpers/calendar";
import DogAttendanceChips from "./DogAttendanceChips";
import EventAttendanceLegend from "./EventAttendanceLegend";

const EventDetails = ({ users, dogs, id, startOpen }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  // Lazy-init only - a deep-linked notification click (see Calendar.jsx)
  // opens straight to attendance-marking instead of one extra tap to expand.
  const [detailsOpen, setDetailsOpen] = useState(!!startOpen);

  const { data: allDogs = [] } = useDogsQuery();
  const { data: allUsers = [] } = useUsersQuery();
  const { user } = useAuthContext();
  const toggleEventDogMutation = useToggleEventDogMutation();
  const toggleEventUserMutation = useToggleEventUserMutation();
  const isSuperAdmin = useIsSuperAdmin();

  const isMobile = useIsMobile();

  // allDogs/allUsers are already scoped to the team currently acted-as.
  const selectableDogs = isSuperAdmin ? allDogs : user.dogs;
  const selectableUsers = isSuperAdmin ? allUsers : [user];

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
    toggleEventDogMutation.mutate({ id, dogId });
  };

  const onUserPresenceUpdateClick = (userId) => {
    toggleEventUserMutation.mutate({ id, userId });
  };

  const onDetailsOpenChange = () => {
    setDetailsOpen(!detailsOpen);
  };

  const sortedUsersByAttendance = usersWithAttendance.sort(sortByAttendance);

  const getUserButtonPropsById = (_id) => {
    const userFound = users.find(
      ({ _id: currentEventUserId }) => currentEventUserId === _id
    );

    return getAttendanceButtonProps(userFound?.status);
  };

  const getDogButtonPropsById = (_id) => {
    const dogFound = dogs.find(({ _id: currentDogId }) => currentDogId === _id);

    return getAttendanceButtonProps(dogFound?.status);
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
        <Typography>
          {detailsOpen ? t("pages.events.hideDetails") : t("pages.events.showDetails")}
        </Typography>
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
        <EventAttendanceLegend />

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
          {isSuperAdmin
            ? t("pages.events.selectAnyDogAttendance")
            : t("pages.events.selectDogAttendance", { count: selectableDogs.length })}
        </Typography>

        {selectableDogs.length > 0 && (
          <ButtonsGrid sx={{ justifyContent: "flex-start" }}>
            {selectableDogs.map(({ _id: dogId, name }) => (
              <Button
                variant="contained"
                key={dogId}
                {...getDogButtonPropsById(dogId)}
                onClick={() => onDogPresenceUpdateClick(dogId)}
              >
                {name}
              </Button>
            ))}
          </ButtonsGrid>
        )}

        <Typography variant={isMobile ? "body2" : "body1"}>
          {isSuperAdmin
            ? t("pages.events.selectAnyoneAttendance")
            : t("pages.events.selectMyAttendance")}
        </Typography>

        <ButtonsGrid sx={{ justifyContent: "flex-start" }}>
          {selectableUsers.map(({ _id: userId, name }) => (
            <Button
              variant="contained"
              key={userId}
              {...getUserButtonPropsById(userId)}
              onClick={() => onUserPresenceUpdateClick(userId)}
            >
              {name}
            </Button>
          ))}
        </ButtonsGrid>
      </AccordionDetails>
    </Accordion>
  );
};

export default EventDetails;
