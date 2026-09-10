import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  confirmEjsImport,
  fetchCompetitionStats,
  fetchCompetitionTeamMapping,
  fetchEjsCompetitions,
  previewEjsImport,
  setCompetitionTeamMapping,
} from "../helpers/competitionsApi";

// Every competition with imported EJS data - the same list for every user.
export const useEjsCompetitionsQuery = () =>
  useQuery({ queryKey: ["ejsCompetitions"], queryFn: fetchEjsCompetitions });

export const usePreviewEjsImportMutation = () =>
  useMutation({
    mutationFn: ({ eventId, files }: { eventId: string; files: File[] }) => previewEjsImport(eventId, files),
  });

export const useConfirmEjsImportMutation = () =>
  useMutation({
    mutationFn: ({ eventId, files }: { eventId: string; files: File[] }) => confirmEjsImport(eventId, files),
  });

export const useCompetitionTeamMappingQuery = (eventId: string | undefined) =>
  useQuery({
    queryKey: ["competitionTeamMapping", eventId],
    queryFn: () => fetchCompetitionTeamMapping(eventId as string),
    enabled: !!eventId,
  });

export const useSetCompetitionTeamMappingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setCompetitionTeamMapping,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitionTeamMapping"] });
      queryClient.invalidateQueries({ queryKey: ["competitionStats"] });
    },
  });
};

export const useCompetitionStatsQuery = (
  eventId: string | undefined,
  sourceFile?: string,
  lineupKey?: string,
  scope: "ours" | "all" = "ours",
  teamName?: string
) =>
  useQuery({
    queryKey: ["competitionStats", eventId, sourceFile, lineupKey, scope, teamName],
    queryFn: () => fetchCompetitionStats(eventId as string, sourceFile, lineupKey, scope, teamName),
    enabled: !!eventId,
  });

// One stats fetch per lineup (a running order, pinned to its own team) - shares its cache key shape with useCompetitionStatsQuery.
export const useCompetitionStatsByLineupQueries = (
  eventId: string | undefined,
  lineups: { key: string; teamName?: string | null }[]
) =>
  useQueries({
    queries: lineups.map((lineup) => ({
      queryKey: ["competitionStats", eventId, undefined, lineup.key, "ours", lineup.teamName ?? undefined],
      queryFn: () => fetchCompetitionStats(eventId as string, undefined, lineup.key, "ours", lineup.teamName ?? undefined),
      enabled: !!eventId,
    })),
  });

// One stats fetch per competition - for the "across all competitions" trend chart. Same cache-key shape, so single-competition views stay warm.
export const useCompetitionStatsByEventQueries = (
  eventIds: string[],
  { scope = "ours", teamName, lineupKey }: { scope?: "ours" | "all"; teamName?: string; lineupKey?: string } = {}
) =>
  useQueries({
    queries: eventIds.map((eventId) => ({
      queryKey: ["competitionStats", eventId, undefined, lineupKey, scope, teamName],
      queryFn: () => fetchCompetitionStats(eventId, undefined, lineupKey, scope, teamName),
    })),
  });
