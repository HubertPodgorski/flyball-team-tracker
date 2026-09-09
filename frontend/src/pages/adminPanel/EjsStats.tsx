import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@mui/material/styles";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { useEventsQuery } from "../../queries/events";
import { useDogsQuery } from "../../queries/dogs";
import { useTeamsQuery } from "../../queries/teams";
import {
  usePreviewEjsImportMutation,
  useConfirmEjsImportMutation,
  useCompetitionStatsQuery,
  useCompetitionStatsByLineupQueries,
} from "../../queries/competitions";
import { EventType } from "../../components/inputs/consts";
import { CompetitionDogStats, EjsDog } from "../../helpers/types";
import { aggregateLineupRow } from "../../helpers/competitionLineupStats";
import EventForm from "../forms/EventForm";
import CompetitionStatsColumnCards from "../../components/CompetitionStatsColumnCards";
import CompetitionDogTrendCard from "../../components/CompetitionDogTrendCard";
import CompetitionMetricsLineChart, { MetricSeriesDef } from "../../components/CompetitionMetricsLineChart";
import CompetitionOutcomePie from "../../components/CompetitionOutcomePie";
import { OK_GREEN } from "../../helpers/statsColors";

const NO_MATCH = "";

// Club: every matched dog. Team: one specific Team's (dog pool's) roster. Dog: one dog's own trend across days.
type ChartMode = "club" | "team" | "dog";
// Dogs mode compares individual dogs; lineups mode (team tab only) compares whole 4-dog lineups against each other.
type ComparisonMode = "dog" | "lineup";

// One unique-by-name dog across every previewed "our team" row - the same name always resolves the same way, so occurrences beyond the first carry nothing new.
const dedupeDogsByName = (dogs: EjsDog[]): EjsDog[] => [...new Map(dogs.filter((dog) => dog.name).map((dog) => [dog.name as string, dog])).values()];

const filterByDogIds = (dogs: CompetitionDogStats[], dogIds: string[]): CompetitionDogStats[] =>
  dogIds.length === 0 ? dogs : dogs.filter((dog) => dogIds.includes(dog.dogId));

const effectivenessOf = (row: CompetitionDogStats) => (row.totalPasses ? (row.totalPasses - row.faultCount) / row.totalPasses : null);

interface ThemeColors {
  primary: string;
  error: string;
  success: string;
  info: string;
}

// Raw counts, not percentages - a row with zero passes has no data point, but 0 faults/oks out of some passes is a real value, not a gap.
const buildCountSeries = (t: (key: string) => string, colors: ThemeColors): MetricSeriesDef[] => [
  { key: "passes", label: t("pages.ejsStats.columns.passes"), color: colors.primary, getValue: (row) => (row.totalPasses ? row.totalPasses : null) },
  { key: "faultCount", label: t("pages.ejsStats.chartFaultCount"), color: colors.error, getValue: (row) => (row.totalPasses ? row.faultCount : null) },
  { key: "okCount", label: t("pages.ejsStats.chartOkCount"), color: colors.success, getValue: (row) => (row.totalPasses ? row.okCount : null) },
  { key: "cleanCount", label: t("pages.ejsStats.chartCleanCount"), color: colors.info, getValue: (row) => (row.totalPasses ? row.cleanCount : null) },
];

const buildPercentSeries = (t: (key: string) => string, colors: ThemeColors): MetricSeriesDef[] => [
  { key: "faultRate", label: t("pages.ejsStats.columns.faultRate"), color: colors.error, getValue: (row) => (row.faultRate === null ? null : row.faultRate * 100) },
  { key: "okOfAll", label: t("pages.ejsStats.columns.okOfAll"), color: colors.success, getValue: (row) => (row.okPercentOfAllPasses === null ? null : row.okPercentOfAllPasses * 100) },
  {
    key: "effectiveness",
    label: t("pages.ejsStats.columns.effectiveness"),
    color: colors.info,
    getValue: (row) => (effectivenessOf(row) === null ? null : (effectivenessOf(row) as number) * 100),
  },
];

const EjsStats = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { data: events = [] } = useEventsQuery();
  const { data: clubDogs = [] } = useDogsQuery();
  const { data: teams = [] } = useTeamsQuery();
  const previewMutation = usePreviewEjsImportMutation();
  const confirmMutation = useConfirmEjsImportMutation();

  const [eventId, setEventId] = useState("");
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [teamNames, setTeamNames] = useState<string[] | null>(null);
  const [ourTeamNames, setOurTeamNames] = useState<string[]>([]);
  const [previewDogs, setPreviewDogs] = useState<EjsDog[] | null>(null);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [statsLineupId, setStatsLineupId] = useState("");
  const [statsDogIds, setStatsDogIds] = useState<string[]>([]);
  const [chartMode, setChartMode] = useState<ChartMode>("club");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>("dog");

  const competitionEvents = events.filter((event) => event.type === EventType.COMPETITION);
  const lineups = teams.flatMap((team) => team.matchups);
  const { data: stats } = useCompetitionStatsQuery(eventId || undefined, undefined, statsLineupId || undefined);

  const selectedTeam = teams.find((team) => team._id === selectedTeamId);
  const teamDogIds = new Set(selectedTeam?.dogs.map((dog) => dog._id) ?? []);
  // Team mode narrows to that team's own roster first; club and dog mode leave the full set untouched.
  const scopedDogs = chartMode === "team" && selectedTeamId ? (stats?.dogs ?? []).filter((dog) => teamDogIds.has(dog.dogId)) : stats?.dogs ?? [];
  const visibleDogs = filterByDogIds(scopedDogs, statsDogIds);

  // Team mode always has exactly one team picked - default to the first as soon as the list (or the mode) is ready.
  useEffect(() => {
    if (chartMode === "team" && !selectedTeamId && teams.length > 0) setSelectedTeamId(teams[0]._id);
  }, [chartMode, selectedTeamId, teams]);

  // Dog mode always has exactly one dog picked - default to the first as soon as the roster (or the mode) is ready.
  useEffect(() => {
    if (chartMode === "dog" && statsDogIds.length === 0 && scopedDogs.length > 0) setStatsDogIds([scopedDogs[0].dogId]);
  }, [chartMode, statsDogIds, scopedDogs]);

  // visibleDogs already narrows to just the one picked dog in dog mode (statsDogIds is single-select there) - aggregated across every uploaded EJS file.
  const selectedDogId = chartMode === "dog" ? statsDogIds[0] : undefined;
  const chartRows = visibleDogs;
  const pieDogs = visibleDogs;

  const lineupResults = useCompetitionStatsByLineupQueries(
    eventId || undefined,
    chartMode === "team" && comparisonMode === "lineup" ? (selectedTeam?.matchups.map((lineup) => lineup._id) ?? []) : []
  );
  const lineupRows =
    chartMode === "team" && comparisonMode === "lineup" && selectedTeam
      ? selectedTeam.matchups.map((lineup, index) => aggregateLineupRow(lineup, lineupResults[index]?.data?.dogs ?? []))
      : [];
  const comparisonRows = comparisonMode === "lineup" ? lineupRows : chartRows;

  const colors: ThemeColors = {
    primary: theme.palette.primary.main,
    error: theme.palette.error.main,
    success: OK_GREEN,
    info: theme.palette.info.main,
  };

  const noChartDataLabel =
    chartMode === "dog" && !selectedDogId
      ? t("pages.ejsStats.pickDogHint")
      : chartMode === "team" && !selectedTeamId
        ? t("pages.ejsStats.pickTeamHint")
        : t("pages.ejsStats.noChartData");

  const resetWizard = () => {
    setFiles([]);
    setTeamNames(null);
    setOurTeamNames([]);
    setPreviewDogs(null);
    setOverrides({});
  };

  const onEventChange = (newEventId: string) => {
    setEventId(newEventId);
    setStatsLineupId("");
    setStatsDogIds([]);
    setChartMode("club");
    setSelectedTeamId("");
    resetWizard();
  };

  const onChartModeChange = (mode: ChartMode) => {
    setChartMode(mode);
    setStatsDogIds([]);
    setSelectedTeamId("");
    setComparisonMode("dog");

    // Lineup is team-only - reset it when leaving team mode, so a leftover pick doesn't silently narrow club/dog mode.
    if (mode !== "team") setStatsLineupId("");
  };

  // Club/team mode: chips toggle independently (multi-select). Dog mode: picking one always replaces the current pick (single-select).
  const toggleStatsDog = (dogId: string) => {
    if (chartMode === "dog") {
      setStatsDogIds((current) => (current[0] === dogId ? [] : [dogId]));
      return;
    }

    setStatsDogIds((current) => (current.includes(dogId) ? current.filter((id) => id !== dogId) : [...current, dogId]));
  };

  const onUploadClick = () => {
    previewMutation.mutate(
      { eventId, files },
      {
        onSuccess: (result) => {
          setTeamNames(result.teamNames);
          setOurTeamNames([]);
          setPreviewDogs(null);
        },
        onError: () => enqueueSnackbar(t("pages.ejsStats.parseFailed"), { variant: "error" }),
      }
    );
  };

  const toggleOurTeam = (teamName: string) => {
    setOurTeamNames((current) => (current.includes(teamName) ? current.filter((name) => name !== teamName) : [...current, teamName]));
  };

  const onReviewMatchesClick = () => {
    previewMutation.mutate(
      { eventId, files, ourTeamNames },
      {
        onSuccess: (result) => setPreviewDogs(dedupeDogsByName(result.entries?.flatMap((entry) => entry.dogs) ?? [])),
        onError: () => enqueueSnackbar(t("pages.ejsStats.parseFailed"), { variant: "error" }),
      }
    );
  };

  const onConfirmClick = () => {
    confirmMutation.mutate(
      { eventId, files, ourTeamNames, dogNameOverrides: overrides },
      {
        onSuccess: ({ count }) => {
          enqueueSnackbar(t("pages.ejsStats.importSuccess", { count }), { variant: "success" });
          queryClient.invalidateQueries({ queryKey: ["competitionStats", eventId] });
          resetWizard();
        },
        onError: () => enqueueSnackbar(t("pages.ejsStats.importFailed"), { variant: "error" }),
      }
    );
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h5">{t("pages.ejsStats.title")}</Typography>

      <Card sx={{ padding: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        <Stack direction="row" sx={{ gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          <FormControl sx={{ minWidth: 220 }}>
            <InputLabel id="ejs-stats-event-label">{t("pages.ejsStats.competition")}</InputLabel>
            <Select
              labelId="ejs-stats-event-label"
              label={t("pages.ejsStats.competition")}
              value={eventId}
              onChange={(event) => onEventChange(event.target.value)}
            >
              {competitionEvents.map((event) => (
                <MenuItem key={event._id} value={event._id}>
                  {event.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button variant="outlined" onClick={() => setEventFormOpen(true)}>
            {t("pages.ejsStats.newCompetition")}
          </Button>
        </Stack>

        {eventId && (
          <Stack direction="row" sx={{ gap: 2, alignItems: "center", flexWrap: "nowrap", overflowX: "auto" }}>
            <Button component="label" variant="outlined" startIcon={<UploadFileIcon />}>
              {files.length > 0 ? t("pages.ejsStats.filesChosen", { count: files.length }) : t("pages.ejsStats.chooseFiles")}
              <input
                type="file"
                hidden
                multiple
                accept=".xls"
                onChange={(event) => setFiles(event.target.files ? Array.from(event.target.files) : [])}
              />
            </Button>

            <Button variant="contained" disabled={files.length === 0 || previewMutation.isPending} onClick={onUploadClick}>
              {t("pages.ejsStats.uploadAndPreview")}
            </Button>
          </Stack>
        )}

        {teamNames && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {t("pages.ejsStats.pickOurTeams")}
            </Typography>

            <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
              {teamNames.map((teamName) => {
                const selected = ourTeamNames.includes(teamName);

                return (
                  <Chip
                    key={teamName}
                    label={teamName}
                    color={selected ? "primary" : "default"}
                    variant={selected ? "filled" : "outlined"}
                    onClick={() => toggleOurTeam(teamName)}
                  />
                );
              })}
            </Stack>

            <Button
              variant="contained"
              sx={{ alignSelf: "flex-start" }}
              disabled={ourTeamNames.length === 0 || previewMutation.isPending}
              onClick={onReviewMatchesClick}
            >
              {t("pages.ejsStats.reviewMatches")}
            </Button>
          </Box>
        )}

        {previewDogs && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {t("pages.ejsStats.reviewMatchesHint")}
            </Typography>

            {previewDogs.map((dog) => {
              const name = dog.name as string;
              const override = overrides[name];
              const value = override ?? dog.matchedDogId ?? NO_MATCH;

              return (
                <Stack key={name} direction="row" sx={{ gap: 2, alignItems: "center" }}>
                  <Typography sx={{ minWidth: 120 }}>{name}</Typography>

                  <FormControl size="small" sx={{ minWidth: 220 }}>
                    <Select value={value} displayEmpty onChange={(event) => setOverrides((current) => ({ ...current, [name]: event.target.value }))}>
                      <MenuItem value={NO_MATCH}>{t("pages.ejsStats.notOneOfOurs")}</MenuItem>

                      {dog.suggestions.map((suggestion) => (
                        <MenuItem key={suggestion.dogId} value={suggestion.dogId}>
                          {suggestion.name}
                        </MenuItem>
                      ))}

                      {clubDogs
                        .filter((clubDog) => !dog.suggestions.some((suggestion) => suggestion.dogId === clubDog._id))
                        .map((clubDog) => (
                          <MenuItem key={clubDog._id} value={clubDog._id}>
                            {clubDog.name}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>

                  {!dog.matchedDogId && !override && <Chip size="small" color="warning" label={t("pages.ejsStats.unmatched")} />}
                </Stack>
              );
            })}

            <Typography variant="caption" color="warning.main">
              {t("pages.ejsStats.confirmReplacesAllWarning")}
            </Typography>

            <Button variant="contained" sx={{ alignSelf: "flex-start" }} disabled={confirmMutation.isPending} onClick={onConfirmClick}>
              {t("pages.ejsStats.confirmImport")}
            </Button>
          </Box>
        )}
      </Card>

      {eventId && (
        <Card sx={{ padding: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <Stack direction="row" sx={{ gap: 2, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
            <Typography variant="h6">{t(`pages.ejsStats.statsTitle${chartMode.charAt(0).toUpperCase()}${chartMode.slice(1)}`)}</Typography>

            <ToggleButtonGroup
              size="small"
              exclusive
              value={chartMode}
              onChange={(event, mode: ChartMode | null) => mode && onChartModeChange(mode)}
            >
              <ToggleButton value="club">{t("common.club")}</ToggleButton>
              <ToggleButton value="team">{t("common.team")}</ToggleButton>
              <ToggleButton value="dog">{t("pages.ejsStats.columns.dog")}</ToggleButton>
            </ToggleButtonGroup>

            <Stack sx={{ gap: 2, width: "100%" }}>
              {chartMode === "team" && teams.length > 0 && (
                <FormControl size="small" sx={{ width: "100%", maxWidth: 400 }}>
                  <InputLabel id="ejs-stats-team-label">{t("common.team")}</InputLabel>
                  <Select
                    labelId="ejs-stats-team-label"
                    label={t("common.team")}
                    value={selectedTeamId}
                    onChange={(event) => setSelectedTeamId(event.target.value)}
                  >
                    {teams.map((team) => (
                      <MenuItem key={team._id} value={team._id}>
                        {team.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {chartMode === "team" && lineups.length > 0 && (
                <FormControl size="small" sx={{ width: "100%", maxWidth: 400 }}>
                  <InputLabel id="ejs-stats-lineup-label" shrink>{t("pages.ejsStats.lineup")}</InputLabel>
                  <Select
                    labelId="ejs-stats-lineup-label"
                    label={t("pages.ejsStats.lineup")}
                    displayEmpty
                    notched
                    value={statsLineupId}
                    onChange={(event) => setStatsLineupId(event.target.value)}
                  >
                    <MenuItem value="">{t("pages.ejsStats.allLineups")}</MenuItem>

                    {lineups.map((lineup) => {
                      const order = lineup.dogs.map((dog) => dog.name).join(" → ");

                      return (
                        <MenuItem key={lineup._id} value={lineup._id}>
                          {lineup.name ? `${lineup.name} (${order})` : order}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              )}
            </Stack>
          </Stack>

          {/* Club mode already has its own "Pies" tab for a single dog - a filter here would just duplicate it. */}
          {chartMode !== "club" && !!scopedDogs.length && (
            <Stack sx={{ gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {chartMode === "dog" ? t("pages.ejsStats.pickDog") : t("pages.ejsStats.filterByDog")}
              </Typography>

              <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
                {scopedDogs.map((dog) => (
                  <Chip
                    key={dog.dogId}
                    label={dog.name || dog.dogId}
                    color={statsDogIds.includes(dog.dogId) ? "primary" : "default"}
                    variant={statsDogIds.includes(dog.dogId) ? "filled" : "outlined"}
                    onClick={() => toggleStatsDog(dog.dogId)}
                  />
                ))}
              </Stack>
            </Stack>
          )}

          {chartMode === "dog" ? (
            <CompetitionDogTrendCard rows={chartRows} noDataLabel={noChartDataLabel} />
          ) : (
            <>
              <CompetitionStatsColumnCards rows={chartRows} noDataLabel={noChartDataLabel} />

              {chartMode === "team" && (
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={comparisonMode}
                  onChange={(event, mode: ComparisonMode | null) => mode && setComparisonMode(mode)}
                  sx={{ alignSelf: "flex-start" }}
                >
                  <ToggleButton value="dog">{t("pages.ejsStats.byMetric")}</ToggleButton>
                  <ToggleButton value="lineup">{t("pages.ejsStats.byLineup")}</ToggleButton>
                </ToggleButtonGroup>
              )}

              <CompetitionMetricsLineChart
                dogs={comparisonRows}
                title={t("pages.ejsStats.metricsChartTitle")}
                noDataLabel={noChartDataLabel}
                series={buildCountSeries(t, colors)}
              />

              <CompetitionMetricsLineChart
                dogs={comparisonRows}
                title={t("pages.ejsStats.metricsChartPercentTitle")}
                noDataLabel={noChartDataLabel}
                series={buildPercentSeries(t, colors)}
                fixedMax={100}
              />
            </>
          )}

          <CompetitionOutcomePie dogs={pieDogs} title={t("pages.ejsStats.outcomeTitle")} noDataLabel={noChartDataLabel} />
        </Card>
      )}

      <EventForm
        open={eventFormOpen}
        onClose={() => setEventFormOpen(false)}
        initialData={{ name: "", date: new Date(), type: EventType.COMPETITION }}
      />
    </Box>
  );
};

export default EjsStats;
