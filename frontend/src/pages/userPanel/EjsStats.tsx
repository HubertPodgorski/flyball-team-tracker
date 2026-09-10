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
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { useEventsQuery } from "../../queries/events";
import {
  useCompetitionStatsQuery,
  useCompetitionStatsByLineupQueries,
  useCompetitionStatsBySourceFileQueries,
  useImportedCompetitionIdsQuery,
} from "../../queries/competitions";
import { EventType } from "../../components/inputs/consts";
import { CompetitionDogStats } from "../../helpers/types";
import { aggregateLineupRow, aggregateClubRow, aggregateStatsRow } from "../../helpers/competitionLineupStats";
import { competitionOptionLabel } from "../../helpers/competitionOptionLabel";
import { ALL_COMPETITIONS } from "../../helpers/competitionsApi";
import EjsImportWizard from "../../components/EjsImportWizard";
import CompetitionStatsColumnCards from "../../components/CompetitionStatsColumnCards";
import CompetitionDogTrendCard from "../../components/CompetitionDogTrendCard";
import CompetitionMetricsLineChart, { MetricSeriesDef } from "../../components/CompetitionMetricsLineChart";
import CompetitionOutcomePie from "../../components/CompetitionOutcomePie";
import { OK_GREEN } from "../../helpers/statsColors";

// Our own matched dogs only, or every club's dogs (ours included) keyed by parsed name.
type ClubScope = "ours" | "all";
// Club: every matched dog. Team: one Team's (dog pool's) roster. Dog: one dog's trend. Clubs: one aggregated row per club (our Teams in "my club", every club in "all clubs").
type ChartMode = "club" | "team" | "dog" | "clubs";
// Dogs mode compares individual dogs; lineups mode (team tab only) compares whole 4-dog lineups against each other.
type ComparisonMode = "dog" | "lineup";

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
  const { data: events = [] } = useEventsQuery();

  const [eventId, setEventId] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [clubScope, setClubScope] = useState<ClubScope>("ours");
  const [statsLineupKey, setStatsLineupKey] = useState("");
  const [statsDogIds, setStatsDogIds] = useState<string[]>([]);
  const [chartMode, setChartMode] = useState<ChartMode>("clubs");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>("dog");

  const { data: importedIds = [] } = useImportedCompetitionIdsQuery();

  const isOurs = clubScope === "ours";
  const importedIdSet = new Set(importedIds);
  // The picker only offers competitions you can actually look at - ones with parsed rows.
  const withDataEvents = events.filter((event) => event.type === EventType.COMPETITION && importedIdSet.has(event._id));
  const hasImportedData = withDataEvents.length > 0;
  const { data: stats, isFetching: statsLoading } = useCompetitionStatsQuery(
    eventId || undefined,
    undefined,
    statsLineupKey || undefined,
    clubScope
  );
  // Lineups come straight from the imported rows' own running orders - not from any registered Team.matchups.
  const statsLineups = stats?.lineups ?? [];

  // Everything the user picks from is listed alphabetically - dog names, club/team names, squads alike.
  const byName = <T extends { name: string | null }>(a: T, b: T) => (a.name ?? "").localeCompare(b.name ?? "");

  // Teams are the sheet team names the stats came back grouped by - same for our own club and for everyone else.
  const teamOptions = (stats?.teamNames ?? []).map((name) => ({ id: name, name })).sort(byName);
  const oneTeamSelected = chartMode === "team" && !!selectedTeamId;
  // In "all clubs" the club name only helps on the mixed all-dogs list - a picked team or dog already pins it down.
  const showClubSubLabel = !isOurs && chartMode !== "team" && chartMode !== "dog";
  const decoratedDogs = (stats?.dogs ?? [])
    .map((dog) => (showClubSubLabel && dog.teamName ? { ...dog, nameSubLabel: dog.teamName } : dog))
    .sort(byName);
  // Team mode narrows to one team by its name; club and dog mode leave the full set untouched.
  const scopedDogs = oneTeamSelected ? decoratedDogs.filter((dog) => dog.teamName === selectedTeamId) : decoratedDogs;
  const visibleDogs = filterByDogIds(scopedDogs, statsDogIds);

  // "Club" tab in "my club": a single summary row for the whole club. "Whole clubs" tab in "all clubs": one row per club.
  const inClubAggMode = chartMode === "clubs";
  const clubRows = !inClubAggMode
    ? []
    : isOurs
      ? [aggregateStatsRow({ dogId: "club", name: t("pages.ejsStats.myClub") }, decoratedDogs)]
      : (stats?.teamNames ?? []).map((teamName) => aggregateClubRow(teamName, decoratedDogs)).sort(byName);

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

  const inLineupMode = isOurs && chartMode === "team" && comparisonMode === "lineup";
  const lineupResults = useCompetitionStatsByLineupQueries(
    eventId || undefined,
    inLineupMode ? statsLineups.map((lineup) => lineup.key) : []
  );
  const lineupRows = inLineupMode
    ? statsLineups.map((lineup, index) => aggregateLineupRow(lineup, lineupResults[index]?.data?.dogs ?? []))
    : [];
  const comparisonRows = comparisonMode === "lineup" ? lineupRows : chartRows;

  // "All competitions together" + one dog or team picked: compare that subject file by file, file name on the X axis.
  const perFileMode =
    eventId === ALL_COMPETITIONS &&
    (stats?.sourceFiles?.length ?? 0) > 1 &&
    ((chartMode === "dog" && !!selectedDogId) || oneTeamSelected);
  const perFileSourceFiles = perFileMode ? stats?.sourceFiles ?? [] : [];
  const perFileResults = useCompetitionStatsBySourceFileQueries(
    perFileMode ? ALL_COMPETITIONS : undefined,
    perFileSourceFiles,
    clubScope
  );
  const perFileRows: CompetitionDogStats[] = perFileMode
    ? perFileSourceFiles.map((file, index) => {
        const fileDogs = perFileResults[index]?.data?.dogs ?? [];
        const subjectDogs =
          chartMode === "dog"
            ? fileDogs.filter((dog) => dog.dogId === selectedDogId)
            : fileDogs.filter((dog) => dog.teamName === selectedTeamId);

        return aggregateStatsRow({ dogId: file, name: file.replace(/\.xlsx?$/i, "") }, subjectDogs);
      })
    : [];

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

      <Card sx={{ padding: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {hasImportedData ? t("pages.ejsStats.pickWithDataHint") : t("pages.ejsStats.noDataHint")}
        </Typography>

        <Stack direction="row" sx={{ gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          {hasImportedData && (
            <>
              <FormControl sx={{ minWidth: 260 }}>
                <InputLabel id="ejs-stats-event-label">{t("pages.ejsStats.pickWithData")}</InputLabel>
                <Select
                  labelId="ejs-stats-event-label"
                  label={t("pages.ejsStats.pickWithData")}
                  value={withDataEvents.some((event) => event._id === eventId) ? eventId : ""}
                  onChange={(event) => onEventChange(event.target.value)}
                >
                  {withDataEvents.map((event) => (
                    <MenuItem key={event._id} value={event._id}>
                      {competitionOptionLabel(event)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Typography variant="body2" color="text.secondary">
                {t("pages.ejsStats.or")}
              </Typography>

              <Button
                variant={eventId === ALL_COMPETITIONS ? "contained" : "outlined"}
                onClick={() => onEventChange(ALL_COMPETITIONS)}
              >
                {t("pages.ejsStats.allCompetitions")}
              </Button>

              <Typography variant="body2" color="text.secondary">
                {t("pages.ejsStats.or")}
              </Typography>
            </>
          )}

          <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => setWizardOpen(true)}>
            {t("pages.ejsStats.importData")}
          </Button>
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
            <ToggleButton value="all">{t("pages.ejsStats.allClubs")}</ToggleButton>
          </ToggleButtonGroup>

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
              <ToggleButton value="clubs">{isOurs ? t("common.club") : t("pages.ejsStats.wholeClubs")}</ToggleButton>
              <ToggleButton value="club">{t("pages.ejsStats.allDogs")}</ToggleButton>
              <ToggleButton value="team">{t("common.team")}</ToggleButton>
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

              {isOurs && chartMode === "team" && statsLineups.length > 0 && (
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

              {!isOurs && chartMode === "dog" ? (
                // Every opponent club's dogs at once is a long list - a picker beats a wall of chips.
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
                        {dog.teamName ? `${dog.name || dog.dogId} (${dog.teamName})` : dog.name || dog.dogId}
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
                <CompetitionDogTrendCard rows={chartRows} noDataLabel={noChartDataLabel} hideAverageTimes={inClubAggMode} />
              ) : (
                <>
                  <CompetitionStatsColumnCards rows={chartRows} noDataLabel={noChartDataLabel} hideAverageTimes={inClubAggMode} />

                  {isOurs && chartMode === "team" && (
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
                    title={inClubAggMode ? t("pages.ejsStats.clubsChartTitle") : t("pages.ejsStats.metricsChartTitle")}
                    noDataLabel={noChartDataLabel}
                    series={buildCountSeries(t, colors)}
                  />

                  <CompetitionMetricsLineChart
                    dogs={comparisonRows}
                    title={inClubAggMode ? t("pages.ejsStats.clubsChartPercentTitle") : t("pages.ejsStats.metricsChartPercentTitle")}
                    noDataLabel={noChartDataLabel}
                    series={buildPercentSeries(t, colors)}
                    fixedMax={100}
                  />
                </>
              )}

              {perFileMode && (
                <>
                  <CompetitionMetricsLineChart
                    dogs={perFileRows}
                    title={t("pages.ejsStats.byFileChartTitle")}
                    noDataLabel={noChartDataLabel}
                    series={buildCountSeries(t, colors)}
                  />

                  <CompetitionMetricsLineChart
                    dogs={perFileRows}
                    title={t("pages.ejsStats.byFileChartPercentTitle")}
                    noDataLabel={noChartDataLabel}
                    series={buildPercentSeries(t, colors)}
                    fixedMax={100}
                  />
                </>
              )}

              <CompetitionOutcomePie dogs={pieDogs} title={t("pages.ejsStats.outcomeTitle")} noDataLabel={noChartDataLabel} />
            </>
          )}
        </Card>
      )}

      <EjsImportWizard open={wizardOpen} onClose={() => setWizardOpen(false)} onImported={onEventChange} />
    </Box>
  );
};

export default EjsStats;
