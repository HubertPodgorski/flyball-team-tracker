import { useMutation, useQueries, useQuery } from "@tanstack/react-query";
import { previewEjsImport, confirmEjsImport, fetchCompetitionStats } from "../helpers/competitionsApi";

export const usePreviewEjsImportMutation = () =>
  useMutation({
    mutationFn: ({ eventId, files, ourTeamNames }: { eventId: string; files: File[]; ourTeamNames?: string[] }) =>
      previewEjsImport(eventId, files, ourTeamNames),
  });

export const useConfirmEjsImportMutation = () =>
  useMutation({
    mutationFn: ({
      eventId,
      files,
      ourTeamNames,
      dogNameOverrides,
    }: {
      eventId: string;
      files: File[];
      ourTeamNames: string[];
      dogNameOverrides: Record<string, string>;
    }) => confirmEjsImport(eventId, files, ourTeamNames, dogNameOverrides),
  });

export const useCompetitionStatsQuery = (eventId: string | undefined, sourceFile?: string, lineupId?: string) =>
  useQuery({
    queryKey: ["competitionStats", eventId, sourceFile, lineupId],
    queryFn: () => fetchCompetitionStats(eventId as string, sourceFile, lineupId),
    enabled: !!eventId,
  });

// One stats fetch per lineup - shares its cache key shape with useCompetitionStatsQuery, so it reuses whatever's already loaded.
export const useCompetitionStatsByLineupQueries = (eventId: string | undefined, lineupIds: string[]) =>
  useQueries({
    queries: lineupIds.map((lineupId) => ({
      queryKey: ["competitionStats", eventId, undefined, lineupId],
      queryFn: () => fetchCompetitionStats(eventId as string, undefined, lineupId),
      enabled: !!eventId,
    })),
  });
