import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import SettingsIcon from "@mui/icons-material/Settings";
import {
  useCompetitionStatsQuery,
  useCompetitionStatsByLineupQueries,
  useCompetitionStatsByEventQueries,
  useEjsCompetitionsQuery,
  useGlobalTeamMappingQuery,
} from "../../queries/competitions";
import { useIsSuperAdmin } from "../../hooks/useIsSuperAdmin";
import { useIsTrainer } from "../../hooks/useIsTrainer";
import { useAuthContext } from "../../hooks/useAuthContext";
import { CompetitionDogStats } from "../../helpers/types";
import { aggregateLineupRow, aggregateStatsRow } from "../../helpers/competitionLineupStats";
import { competitionOptionLabel } from "../../helpers/competitionOptionLabel";
import { ALL_COMPETITIONS } from "../../helpers/competitionsApi";
import EjsImportWizard from "../../components/EjsImportWizard";
import EjsTeamMappingModal from "../../components/EjsTeamMappingModal";
import CompetitionStatsColumnCards from "../../components/CompetitionStatsColumnCards";
import CompetitionDogTrendCard from "../../components/CompetitionDogTrendCard";
import CompetitionPredecessorCard from "../../components/CompetitionPredecessorCard";
import CompetitionRecordsCard from "../../components/CompetitionRecordsCard";
import CompetitionNetVsGrossCard from "../../components/CompetitionNetVsGrossCard";
import CompetitionMetricsLineChart, { MetricSeriesDef } from "../../components/CompetitionMetricsLineChart";
import CompetitionOutcomePie from "../../components/CompetitionOutcomePie";
import { OK_GREEN } from "../../helpers/statsColors";

// Our mapped team's dogs ("ours"), that set narrowed to the current user's own dogs ("mine"), or every club's dogs ("all").
type ClubScope = "ours" | "mine" | "all";
// Club: every matched dog. Team: one Team's (dog pool's) roster. Dog: one dog's trend. Clubs: one aggregated row per club (our Teams in "my club", every club in "all clubs").
type ChartMode = "club" | "team" | "dog" | "clubs";
// Dogs mode compares individual dogs; lineups mode (team tab only) compares whole 4-dog lineups against each other.
type ComparisonMode = "dog" | "lineup";

const filterByDogIds = (dogs: CompetitionDogStats[], dogIds: string[]): CompetitionDogStats[] =>
  dogIds.length === 0 ? dogs : dogs.filter((dog) => dogIds.includes(dog.dogId));

const EMPTY_RECORDS = { teamBests: [], dogBests: [] };

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
  const isSuperAdmin = useIsSuperAdmin();
  // Only a trainer maps teams (useIsTrainer already covers super-admin too) - a plain club member never sees this.
  const isTrainer = useIsTrainer();
  const { user } = useAuthContext();

  const { data: withDataEvents = [] } = useEjsCompetitionsQuery();

  const [eventId, setEventId] = useState(ALL_COMPETITIONS);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false);
  const [clubScope, setClubScope] = useState<ClubScope>("ours");
  const [statsLineupKey, setStatsLineupKey] = useState("");
  const [statsDogIds, setStatsDogIds] = useState<string[]>([]);
  const [chartMode, setChartMode] = useState<ChartMode>("clubs");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>("dog");

  // Auto-opens the mapping modal once for a trainer (not super-admin) whose club owns no EJS team name anywhere yet.
  const { data: globalMapping } = useGlobalTeamMappingQuery(isTrainer && !isSuperAdmin);
  const [autoOpenedMapping, setAutoOpenedMapping] = useState(false);

  useEffect(() => {
    if (autoOpenedMapping || !isTrainer || isSuperAdmin || !globalMapping) return;
    if (globalMapping.teamNames.length > 0 && globalMapping.myTeamNames.length === 0) {
      setMappingDialogOpen(true);
      setAutoOpenedMapping(true);
    }
  }, [autoOpenedMapping, isTrainer, isSuperAdmin, globalMapping]);

  // "mine" and "ours" both read the club's mapped-team rows from the server; "mine" then narrows to the user's own dogs.
  const isOurs = clubScope !== "all";
  const serverScope = clubScope === "all" ? "all" : "ours";
  const myDogNames = new Set((user?.dogs ?? []).map((dog) => dog.name.trim().toLowerCase()));
  const hasImportedData = withDataEvents.length > 0;
  // The Team tab pins every query to the one picked team, so "all clubs" teams behave exactly like our own.
  const teamNameParam = chartMode === "team" && selectedTeamId ? selectedTeamId : undefined;
  const { data: stats, isFetching: statsLoading } = useCompetitionStatsQuery(
    eventId || undefined,
    undefined,
    statsLineupKey || undefined,
    serverScope,
    teamNameParam
  );
  // Everything the user picks from is listed alphabetically - dog names, club/team names, squads alike.
  const byName = <T extends { name: string | null }>(a: T, b: T) => (a.name ?? "").localeCompare(b.name ?? "");

  // "My club" tab picks from our own mapped teams only; "all clubs" picks from every team in the competition.
  const teamOptions = ((isOurs ? stats?.myTeamNames : stats?.teamNames) ?? [])
    .map((name) => ({ id: name, name }))
    .sort(byName);
  const oneTeamSelected = chartMode === "team" && !!selectedTeamId;

  // Lineups come straight from the imported rows' own running orders; in team mode, only the picked team's.
  const statsLineups = (stats?.lineups ?? []).filter(
    (lineup) => !oneTeamSelected || !lineup.teamName || lineup.teamName === selectedTeamId
  );
  // In "all clubs" the club name only helps on the mixed all-dogs list - a picked team or dog already pins it down.
  const showClubSubLabel = !isOurs && chartMode !== "team" && chartMode !== "dog";
  const decoratedDogs = (stats?.dogs ?? [])
    .filter((dog) => clubScope !== "mine" || myDogNames.has((dog.name ?? "").trim().toLowerCase()))
    .map((dog) => (showClubSubLabel && dog.teamName ? { ...dog, nameSubLabel: dog.teamName } : dog))
    .sort(byName);
  // Team mode narrows to one team by its name; club and dog mode leave the full set untouched.
  const scopedDogs = oneTeamSelected ? decoratedDogs.filter((dog) => dog.teamName === selectedTeamId) : decoratedDogs;
  const visibleDogs = filterByDogIds(scopedDogs, statsDogIds);

  // "Statystyki klubu" (my club): one summary row for the whole club. "Statystyki klubów" (all clubs): one row per club,
  // a club being all of its mapped team names summed - falls back to the raw team name while a team is still unmapped.
  const inClubAggMode = chartMode === "clubs";
  const clubGroups = new Map<string, string[]>();

  if (inClubAggMode && !isOurs) {
    (stats?.teamNames ?? []).forEach((teamName) => {
      const club = stats?.clubByTeamName?.[teamName] ?? teamName;

      clubGroups.set(club, [...(clubGroups.get(club) ?? []), teamName]);
    });
  }

  const clubRows = !inClubAggMode
    ? []
    : isOurs
      ? [aggregateStatsRow({ dogId: "club", name: t("pages.ejsStats.myClub") }, decoratedDogs)]
      : [...clubGroups.entries()]
          .map(([club, names]) =>
            aggregateStatsRow(
              { dogId: club, name: club },
              decoratedDogs.filter((dog) => !!dog.teamName && names.includes(dog.teamName))
            )
          )
          .sort(byName);

  // Team mode always has exactly one team picked - default to the first as soon as the list (or the mode) is ready.
  useEffect(() => {
    if (chartMode === "team" && !selectedTeamId && teamOptions.length > 0) setSelectedTeamId(teamOptions[0].id);
  }, [chartMode, selectedTeamId, teamOptions]);

  // Dog mode always has exactly one dog picked - default to the first as soon as the roster (or the mode) is ready.
  useEffect(() => {
    if (chartMode === "dog" && statsDogIds.length === 0 && scopedDogs.length > 0) setStatsDogIds([scopedDogs[0].dogId]);
  }, [chartMode, statsDogIds, scopedDogs]);

  // Team mode's dog filter starts with every dog selected, so the chips read as "all on" rather than a blank filter.
  useEffect(() => {
    if (chartMode === "team" && statsDogIds.length === 0 && scopedDogs.length > 0) setStatsDogIds(scopedDogs.map((dog) => dog.dogId));
  }, [chartMode, statsDogIds, scopedDogs]);

  const selectedDogId = chartMode === "dog" ? statsDogIds[0] : undefined;
  const chartRows = inClubAggMode ? clubRows : visibleDogs;
  const pieDogs = inClubAggMode ? clubRows : visibleDogs;

  const inLineupMode = chartMode === "team" && comparisonMode === "lineup";
  const lineupResults = useCompetitionStatsByLineupQueries(
    eventId || undefined,
    inLineupMode ? statsLineups.map((lineup) => ({ key: lineup.key, teamName: lineup.teamName })) : []
  );
  const lineupRows = inLineupMode
    ? statsLineups.map((lineup, index) => aggregateLineupRow(lineup, lineupResults[index]?.data?.dogs ?? []))
    : [];
  const comparisonRows = comparisonMode === "lineup" ? lineupRows : chartRows;

  // "All competitions together" + a single subject picked: chart that subject competition by competition (a trend).
  // Only where one subject is in view - the whole club, a picked team, a picked lineup, or a picked dog - never the multi-club aggregate.
  // A whole-team trend makes sense; a single lineup's does not (it rarely recurs across competitions), so a picked lineup suppresses it.
  const acrossCompetitions = eventId === ALL_COMPETITIONS;
  const trendMode: "club" | "team" | "dog" | null = !acrossCompetitions
    ? null
    : chartMode === "clubs" && isOurs
      ? "club"
      : chartMode === "team" && selectedTeamId && !statsLineupKey
        ? "team"
        : chartMode === "dog" && selectedDogId
          ? "dog"
          : null;
  const trendResults = useCompetitionStatsByEventQueries(trendMode ? withDataEvents.map((event) => event._id) : [], {
    scope: serverScope,
    teamName: trendMode === "team" ? selectedTeamId : undefined,
  });
  const trendRows: CompetitionDogStats[] = trendMode
    ? withDataEvents.map((event, index) => {
        const eventDogs = trendResults[index]?.data?.dogs ?? [];
        const subject = trendMode === "dog" ? eventDogs.filter((dog) => dog.dogId === selectedDogId) : eventDogs;

        return aggregateStatsRow({ dogId: event._id, name: event.name }, subject);
      })
    : [];
  const trendVisible = trendRows.filter((row) => row.totalPasses > 0).length > 1;

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

  const outcomePie = (
    <CompetitionOutcomePie dogs={pieDogs} title={t("pages.ejsStats.outcomeTitle")} noDataLabel={noChartDataLabel} />
  );

  // Competition-to-competition trend - sits under the outcome pie, and (in team mode) above the Dogs/Lineups toggle.
  const trendCharts = trendVisible ? (
    <>
      <CompetitionMetricsLineChart
        dogs={trendRows}
        title={t("pages.ejsStats.betweenCompetitionsChartPercentTitle")}
        noDataLabel={noChartDataLabel}
        series={buildPercentSeries(t, colors)}
        fixedMax={100}
      />

      <CompetitionMetricsLineChart
        dogs={trendRows}
        title={t("pages.ejsStats.betweenCompetitionsChartTitle")}
        noDataLabel={noChartDataLabel}
        series={buildCountSeries(t, colors)}
      />
    </>
  ) : null;

  const resetStatsView = () => {
    setStatsLineupKey("");
    setStatsDogIds([]);
    setChartMode("clubs");
    setSelectedTeamId("");
    setComparisonMode("dog");
  };

  const onEventChange = (newEventId: string) => {
    setEventId(newEventId);
    setClubScope("ours");
    resetStatsView();
  };

  const onClubScopeChange = (scope: ClubScope) => {
    setClubScope(scope);
    resetStatsView();
  };

  const onChartModeChange = (mode: ChartMode) => {
    setChartMode(mode);
    setStatsDogIds([]);
    setSelectedTeamId("");
    setComparisonMode("dog");

    // Lineup is team-only - reset it when leaving team mode, so a leftover pick doesn't silently narrow club/dog mode.
    if (mode !== "team") setStatsLineupKey("");
  };

  // Club/team mode: chips toggle independently (multi-select). Dog mode: picking one always replaces the current pick (single-select).
  const toggleStatsDog = (dogId: string) => {
    if (chartMode === "dog") {
      setStatsDogIds((current) => (current[0] === dogId ? [] : [dogId]));
      return;
    }

    setStatsDogIds((current) => (current.includes(dogId) ? current.filter((id) => id !== dogId) : [...current, dogId]));
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h5">{t("pages.ejsStats.title")}</Typography>
      <Typography variant="body2" color="text.secondary">
        {t("pages.ejsStats.chooseTeamsHint")}
      </Typography>

      <Card sx={{ padding: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {hasImportedData ? t("pages.ejsStats.pickWithDataHint") : t("pages.ejsStats.noDataHint")}
        </Typography>

        <Stack direction="row" sx={{ gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          <FormControl sx={{ flexGrow: 1, minWidth: 200, maxWidth: 400 }}>
            <InputLabel id="ejs-stats-event-label">{t("pages.ejsStats.pickWithData")}</InputLabel>
            <Select
              labelId="ejs-stats-event-label"
              label={t("pages.ejsStats.pickWithData")}
              value={eventId}
              onChange={(event) => onEventChange(event.target.value)}
            >
              <MenuItem value={ALL_COMPETITIONS}>{t("pages.ejsStats.allCompetitions")}</MenuItem>
              {withDataEvents.map((event) => (
                <MenuItem key={event._id} value={event._id}>
                  {competitionOptionLabel(event)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Only a super-admin imports EJS files - the shared pool is global, every club just reads it. */}
          {isSuperAdmin && (
            <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => setWizardOpen(true)}>
              {t("pages.ejsStats.importData")}
            </Button>
          )}

          {/* Only a trainer maps teams to clubs (isTrainer already covers super-admin too). */}
          {isTrainer && (
          <Tooltip title={isSuperAdmin ? t("pages.ejsStats.mapTeamsButton") : t("pages.ejsStats.chooseClubTeamsButton")}>
            <IconButton
              aria-label={isSuperAdmin ? t("pages.ejsStats.mapTeamsButton") : t("pages.ejsStats.chooseClubTeamsButton")}
              onClick={() => setMappingDialogOpen(true)}
              sx={{ ml: "auto" }}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          )}
        </Stack>
      </Card>


      {eventId && (
        <Card sx={{ padding: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={clubScope}
            onChange={(event, scope: ClubScope | null) => scope && onClubScopeChange(scope)}
            sx={{ alignSelf: "flex-start" }}
          >
            <ToggleButton value="ours">{t("pages.ejsStats.myClub")}</ToggleButton>
            <ToggleButton value="mine">{t("pages.ejsStats.myDogs")}</ToggleButton>
            <ToggleButton value="all">{t("pages.ejsStats.allClubs")}</ToggleButton>
          </ToggleButtonGroup>

          {/* "My dogs": one row per own dog - its stats card and its outcome pie, side by side on desktop, stacked on mobile. */}
          {clubScope === "mine" ? (
            statsLoading && !stats ? (
              <Skeleton variant="rounded" height={280} />
            ) : decoratedDogs.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {t("pages.ejsStats.myDogsNoData")}
              </Typography>
            ) : (
              <Stack sx={{ gap: 2 }}>
                {decoratedDogs.map((dog) => (
                  <Stack
                    key={dog.dogId}
                    sx={{ gap: 1, bgcolor: "action.hover", borderRadius: 1, padding: { xs: 1, md: 1.5 } }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column", md: "row" },
                        alignItems: "stretch",
                        gap: { xs: 1, md: 2 },
                        "& > *": { flex: { xs: "0 1 auto", md: "1 1 0" }, minWidth: 0 },
                      }}
                    >
                      <CompetitionDogTrendCard rows={[dog]} noDataLabel={t("pages.ejsStats.noChartData")} />
                      <CompetitionOutcomePie
                        dogs={[dog]}
                        title={t("pages.ejsStats.outcomeTitle")}
                        noDataLabel={t("pages.ejsStats.noChartData")}
                      />
                    </Box>
                    <CompetitionPredecessorCard pairings={stats?.pairings ?? []} dogFilter={dog.name ?? undefined} />
                  </Stack>
                ))}
              </Stack>
            )
          ) : (
          <>
          <Stack direction="row" sx={{ gap: 2, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
            <Typography variant="h6">
              {chartMode === "clubs" && isOurs
                ? t("pages.ejsStats.statsTitleOurClub")
                : t(`pages.ejsStats.statsTitle${chartMode.charAt(0).toUpperCase()}${chartMode.slice(1)}`)}
            </Typography>

            <ToggleButtonGroup
              size="small"
              exclusive
              value={chartMode}
              onChange={(event, mode: ChartMode | null) => mode && onChartModeChange(mode)}
            >
              <ToggleButton value="clubs">
                {isOurs ? t("pages.ejsStats.statsTitleOurClub") : t("pages.ejsStats.wholeClubs")}
              </ToggleButton>
              <ToggleButton value="club">{t("pages.ejsStats.allDogs")}</ToggleButton>
              <ToggleButton value="team">{t("pages.ejsStats.teamsTab")}</ToggleButton>
              <ToggleButton value="dog">{t("pages.ejsStats.columns.dog")}</ToggleButton>
            </ToggleButtonGroup>

            <Stack sx={{ gap: 2, width: "100%" }}>
              {chartMode === "team" && teamOptions.length > 0 && (
                <FormControl size="small" sx={{ width: "100%", maxWidth: 400 }}>
                  <InputLabel id="ejs-stats-team-label">{t("common.team")}</InputLabel>
                  <Select
                    labelId="ejs-stats-team-label"
                    label={t("common.team")}
                    value={selectedTeamId}
                    onChange={(event) => {
                      setSelectedTeamId(event.target.value);
                      setStatsDogIds([]);
                    }}
                  >
                    {teamOptions.map((team) => (
                      <MenuItem key={team.id} value={team.id}>
                        {team.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {chartMode === "team" && statsLineups.length > 0 && (
                <FormControl size="small" sx={{ width: "100%", maxWidth: 400 }}>
                  <InputLabel id="ejs-stats-lineup-label" shrink>{t("pages.ejsStats.lineup")}</InputLabel>
                  <Select
                    labelId="ejs-stats-lineup-label"
                    label={t("pages.ejsStats.lineup")}
                    displayEmpty
                    notched
                    value={statsLineupKey}
                    onChange={(event) => setStatsLineupKey(event.target.value)}
                  >
                    <MenuItem value="">{t("pages.ejsStats.allLineups")}</MenuItem>

                    {statsLineups.map((lineup) => (
                      <MenuItem key={lineup.key} value={lineup.key}>
                        {lineup.order} ({t("pages.ejsStats.wizard.heats", { count: lineup.heatCount })})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Stack>
          </Stack>

          {/* Only the team and dog tabs pick from individual dogs - club and whole-clubs tabs show everything. */}
          {(chartMode === "team" || chartMode === "dog") && !!scopedDogs.length && (
            <Stack sx={{ gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {chartMode === "dog" ? t("pages.ejsStats.pickDog") : t("pages.ejsStats.filterByDog")}
              </Typography>

              {chartMode === "dog" ? (
                // Dog tab is a single pick - a select, not a wall of chips (the team tab keeps chips for its multi-select filter).
                <FormControl size="small" sx={{ width: "100%", maxWidth: 400 }}>
                  <InputLabel id="ejs-stats-dog-label">{t("pages.ejsStats.columns.dog")}</InputLabel>
                  <Select
                    labelId="ejs-stats-dog-label"
                    label={t("pages.ejsStats.columns.dog")}
                    value={scopedDogs.some((dog) => dog.dogId === statsDogIds[0]) ? statsDogIds[0] : ""}
                    onChange={(event) => setStatsDogIds(event.target.value ? [event.target.value] : [])}
                  >
                    {scopedDogs.map((dog) => (
                      <MenuItem key={dog.dogId} value={dog.dogId}>
                        {!isOurs && dog.teamName ? `${dog.name || dog.dogId} (${dog.teamName})` : dog.name || dog.dogId}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
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
              )}
            </Stack>
          )}

          {statsLoading && !stats ? (
            <Stack sx={{ gap: 2 }}>
              <Skeleton variant="rounded" height={140} />
              <Skeleton variant="rounded" height={280} />
              <Skeleton variant="rounded" height={280} />
            </Stack>
          ) : (
            <>
              {chartMode === "dog" || (chartMode === "clubs" && isOurs) ? (
                <>
                  {/* Stats card and the outcome pie: two equal halves on desktop (matched height via stretch), stacked full-width on mobile. */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", md: "row" },
                      alignItems: "stretch",
                      gap: 2,
                      "& > *": { flex: { xs: "0 1 auto", md: "1 1 0" }, minWidth: 0 },
                    }}
                  >
                    <CompetitionDogTrendCard rows={chartRows} noDataLabel={noChartDataLabel} hideAverageTimes={inClubAggMode} />
                    {outcomePie}
                  </Box>
                  {trendCharts}

                  {chartMode === "clubs" ? (
                    <>
                      <CompetitionRecordsCard records={stats?.records ?? EMPTY_RECORDS} />
                      <CompetitionNetVsGrossCard stats={stats?.netVsGross ?? []} />
                    </>
                  ) : (
                    selectedDogId && (
                      <>
                        <CompetitionRecordsCard records={stats?.records ?? EMPTY_RECORDS} dogFilter={selectedDogId} />
                        <CompetitionPredecessorCard pairings={stats?.pairings ?? []} dogFilter={selectedDogId} />
                      </>
                    )
                  )}
                </>
              ) : (
                <>
                  <CompetitionStatsColumnCards rows={chartRows} noDataLabel={noChartDataLabel} hideAverageTimes={inClubAggMode} />

                  {outcomePie}
                  {trendCharts}

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
                    title={
                      inClubAggMode
                        ? t("pages.ejsStats.clubsChartPercentTitle")
                        : comparisonMode === "lineup"
                          ? t("pages.ejsStats.lineupsChartPercentTitle")
                          : t("pages.ejsStats.metricsChartPercentTitle")
                    }
                    noDataLabel={noChartDataLabel}
                    series={buildPercentSeries(t, colors)}
                    fixedMax={100}
                  />

                  <CompetitionMetricsLineChart
                    dogs={comparisonRows}
                    title={
                      inClubAggMode
                        ? t("pages.ejsStats.clubsChartTitle")
                        : comparisonMode === "lineup"
                          ? t("pages.ejsStats.lineupsChartTitle")
                          : t("pages.ejsStats.metricsChartTitle")
                    }
                    noDataLabel={noChartDataLabel}
                    series={buildCountSeries(t, colors)}
                  />

                  {chartMode === "team" && selectedTeamId && (
                    <>
                      <CompetitionPredecessorCard pairings={stats?.pairings ?? []} />
                      <CompetitionRecordsCard records={stats?.records ?? EMPTY_RECORDS} />
                      <CompetitionNetVsGrossCard stats={stats?.netVsGross ?? []} />
                    </>
                  )}
                </>
              )}
            </>
          )}
          </>
          )}
        </Card>
      )}

      <EjsImportWizard open={wizardOpen} onClose={() => setWizardOpen(false)} onImported={onEventChange} />
      {isTrainer && (
        <EjsTeamMappingModal open={mappingDialogOpen} onClose={() => setMappingDialogOpen(false)} isSuperAdmin={isSuperAdmin} />
      )}
    </Box>
  );
};

export default EjsStats;
