import { useMutation, useQueries, useQuery } from "@tanstack/react-query";
import {
  previewEjsImport,
  confirmEjsImport,
  fetchCompetitionStats,
  fetchImportedCompetitionIds,
} from "../helpers/competitionsApi";

export const useImportedCompetitionIdsQuery = () =>
  useQuery({ queryKey: ["importedCompetitionIds"], queryFn: fetchImportedCompetitionIds });

export const usePreviewEjsImportMutation = () =>
  useMutation({
    mutationFn: ({ eventId, files, ourTeamNames }: { eventId: string; files: File[]; ourTeamNames?: string[] }) =>
      previewEjsImport(eventId, files, ourTeamNames),
  });

export const useConfirmEjsImportMutation = () =>
  useMutation({
    mutationFn: ({ eventId, files, ourTeamNames }: { eventId: string; files: File[]; ourTeamNames: string[] }) =>
      confirmEjsImport(eventId, files, ourTeamNames),
  });

export const useCompetitionStatsQuery = (
  eventId: string | undefined,
  sourceFile?: string,
  lineupKey?: string,
  scope: "ours" | "all" = "ours"
) =>
  useQuery({
    queryKey: ["competitionStats", eventId, sourceFile, lineupKey, scope],
    queryFn: () => fetchCompetitionStats(eventId as string, sourceFile, lineupKey, scope),
    enabled: !!eventId,
  });

// One stats fetch per lineup (a running order) - shares its cache key shape with useCompetitionStatsQuery, so it reuses whatever's already loaded.
export const useCompetitionStatsByLineupQueries = (eventId: string | undefined, lineupKeys: string[]) =>
  useQueries({
    queries: lineupKeys.map((lineupKey) => ({
      queryKey: ["competitionStats", eventId, undefined, lineupKey, "ours"],
      queryFn: () => fetchCompetitionStats(eventId as string, undefined, lineupKey, "ours"),
      enabled: !!eventId,
    })),
  });

// One stats fetch per uploaded EJS file - for the "across all competitions, file by file" comparison chart.
export const useCompetitionStatsBySourceFileQueries = (
  eventId: string | undefined,
  sourceFiles: string[],
  scope: "ours" | "all" = "ours"
) =>
  useQueries({
    queries: sourceFiles.map((sourceFile) => ({
      queryKey: ["competitionStats", eventId, sourceFile, undefined, scope],
      queryFn: () => fetchCompetitionStats(eventId as string, sourceFile, undefined, scope),
      enabled: !!eventId,
    })),
  });
