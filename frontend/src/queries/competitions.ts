import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  confirmEjsImport,
  fetchAllTeamMappings,
  fetchCompetitionStats,
  fetchGlobalTeamMapping,
  fetchEjsCompetitions,
  previewEjsImport,
  setAdminTeamMapping,
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

// Every EJS team name + mapping + which are the caller's own club's - read side for both mapping modals.
export const useGlobalTeamMappingQuery = (enabled = true) =>
  useQuery({ queryKey: ["globalTeamMapping"], queryFn: fetchGlobalTeamMapping, enabled });

// Super-admin: same, plus the known-club list to suggest in the club picker.
export const useAllTeamMappingsQuery = (enabled: boolean) =>
  useQuery({ queryKey: ["allTeamMappings"], queryFn: fetchAllTeamMappings, enabled });

export const useSetAdminTeamMappingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ club, ejsTeamNames }: { club: string; ejsTeamNames: string[] }) => setAdminTeamMapping(club, ejsTeamNames),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allTeamMappings"] });
      queryClient.invalidateQueries({ queryKey: ["globalTeamMapping"] });
      queryClient.invalidateQueries({ queryKey: ["competitionStats"] });
    },
  });
};

export const useSetCompetitionTeamMappingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ejsTeamNames: string[]) => setCompetitionTeamMapping(ejsTeamNames),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["globalTeamMapping"] });
      queryClient.invalidateQueries({ queryKey: ["allTeamMappings"] });
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
