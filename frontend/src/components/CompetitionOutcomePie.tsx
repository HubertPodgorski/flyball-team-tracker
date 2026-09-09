import React, { useId, useState } from "react";
import { Box, Card, Stack, Typography, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { CompetitionDogStats } from "../helpers/types";
import { aggregateOutcomes } from "../helpers/competitionOutcomes";
import { OK_GREEN, OK_GREEN_BY_TEXT } from "../helpers/statsColors";

const RADIUS = 70;
const CENTER = 120;
const SIZE = CENTER * 2;
const HOVER_OFFSET = 8;
const BRACKET_RADIUS = RADIUS + 14;
const BRACKET_LABEL_RADIUS = BRACKET_RADIUS + 24;
const TOOLTIP_RADIUS = RADIUS + 28;

interface Slice {
  key: string;
  label: string;
  value: number;
  color: string;
  group: "fault" | "ok" | "clean";
}

// Angle 0 is 12 o'clock, increasing clockwise - the way a pie chart is normally read.
const angleOf = (fraction: number) => fraction * 2 * Math.PI;
const pointAt = (angle: number, radius: number) => ({ x: CENTER + radius * Math.sin(angle), y: CENTER - radius * Math.cos(angle) });

// A filled wedge from the center - not a ring - so this reads as an actual pie, not a donut.
const wedgePath = (startAngle: number, endAngle: number, radius: number) => {
  const start = pointAt(startAngle, radius);
  const end = pointAt(endAngle, radius);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  return `M ${CENTER} ${CENTER} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
};

const arcPath = (startAngle: number, endAngle: number, radius: number) => {
  const start = pointAt(startAngle, radius);
  const end = pointAt(endAngle, radius);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
};

interface CompetitionOutcomePieProps {
  dogs: CompetitionDogStats[];
  title: string;
  noDataLabel: string;
}

// A real pie (filled wedges, not a stroked ring), with the "ok" wedges kept adjacent and bracketed as one sub-group, and a hover tooltip per slice.
const CompetitionOutcomePie = ({ dogs, title, noDataLabel }: CompetitionOutcomePieProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const shadowId = useId();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const totals = aggregateOutcomes(dogs);
  // Fixed by exact case, not by whichever order they happened to appear in the sheet - "OK" reads as the most emphatic, so it gets the deepest green.
  const okColorByText = OK_GREEN_BY_TEXT;

  const allSlices: Slice[] = [
    { key: "fault", label: t("pages.ejsStats.outcome.fault"), value: totals.faultCount, color: theme.palette.error.main, group: "fault" },
    ...Object.entries(totals.okByText).map(([text, count]) => ({
      key: `ok-${text}`,
      label: t("pages.ejsStats.outcome.ok", { text }),
      value: count,
      color: okColorByText[text] ?? OK_GREEN,
      group: "ok" as const,
    })),
    { key: "clean", label: t("pages.ejsStats.outcome.clean"), value: totals.cleanRestCount, color: theme.palette.info.main, group: "clean" },
  ];
  const slices = allSlices.filter((slice) => slice.value > 0);

  let cumulativeAngle = 0;
  const wedges = slices.map((slice) => {
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angleOf(slice.value / totals.totalPasses);

    cumulativeAngle = endAngle;

    return { ...slice, startAngle, endAngle, midAngle: (startAngle + endAngle) / 2 };
  });
  // Ok is a sub-slice of clean, not its own category - bracket covers both.
  const cleanGroupWedges = wedges.filter((wedge) => wedge.group === "ok" || wedge.group === "clean");
  const hovered = wedges.find((wedge) => wedge.key === hoveredKey);

  return (
    // Outlined - nests inside the stats Card, which shares the same solid background and would otherwise blend in.
    <Card variant="outlined" sx={{ padding: 2, display: "flex", flexDirection: "column", gap: 1, maxWidth: 600, width: "100%", mx: "auto" }}>
      <Typography variant="subtitle1">{title}</Typography>

      {totals.totalPasses > 0 ? (
        <Stack direction="row" sx={{ gap: 2, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
          <Box sx={{ position: "relative", width: SIZE, height: SIZE, flexShrink: 0 }}>
            <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
              <defs>
                <filter id={shadowId} x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.35" />
                </filter>
              </defs>

              <g filter={`url(#${shadowId})`}>
                {wedges.length === 1 ? (
                  <circle cx={CENTER} cy={CENTER} r={RADIUS} fill={wedges[0].color} />
                ) : (
                  wedges.map((wedge) => {
                    const isHovered = wedge.key === hoveredKey;
                    // Nudges the wedge outward along its own bisector on hover - (0, 0) leaves it exactly in place.
                    const { x: dx, y: dy } = isHovered ? pointAt(wedge.midAngle, HOVER_OFFSET) : { x: CENTER, y: CENTER };

                    return (
                      <path
                        key={wedge.key}
                        d={wedgePath(wedge.startAngle, wedge.endAngle, RADIUS)}
                        fill={wedge.color}
                        stroke={theme.palette.background.paper}
                        strokeWidth={1.5}
                        opacity={hoveredKey && !isHovered ? 0.55 : 1}
                        style={{ transition: "transform 150ms ease, opacity 150ms ease", cursor: "pointer" }}
                        transform={`translate(${dx - CENTER} ${dy - CENTER})`}
                        onMouseEnter={() => setHoveredKey(wedge.key)}
                        onMouseLeave={() => setHoveredKey(null)}
                      />
                    );
                  })
                )}
              </g>

              {/* Ok is a sub-slice of clean - bracket groups ok + clean-rest as one divided slice. */}
              {cleanGroupWedges.length > 1 && (
                <>
                  <path
                    d={arcPath(cleanGroupWedges[0].startAngle, cleanGroupWedges[cleanGroupWedges.length - 1].endAngle, BRACKET_RADIUS)}
                    fill="none"
                    stroke={theme.palette.text.secondary}
                    strokeWidth={1}
                  />
                  <text
                    x={pointAt((cleanGroupWedges[0].startAngle + cleanGroupWedges[cleanGroupWedges.length - 1].endAngle) / 2, BRACKET_LABEL_RADIUS).x}
                    y={pointAt((cleanGroupWedges[0].startAngle + cleanGroupWedges[cleanGroupWedges.length - 1].endAngle) / 2, BRACKET_LABEL_RADIUS).y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={10}
                    fill={theme.palette.text.secondary}
                  >
                    {t("pages.ejsStats.outcome.clean")}
                  </text>
                </>
              )}

              <text x={CENTER} y={CENTER} textAnchor="middle" dominantBaseline="middle" fontSize={22} fill={theme.palette.text.primary}>
                {totals.totalPasses}
              </text>
            </svg>

            {hovered && (
              <Box
                sx={{
                  position: "absolute",
                  left: pointAt(hovered.midAngle, TOOLTIP_RADIUS).x,
                  top: pointAt(hovered.midAngle, TOOLTIP_RADIUS).y,
                  transform: "translate(-50%, -50%)",
                  backgroundColor: "background.paper",
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                  boxShadow: 3,
                  padding: "4px 8px",
                  pointerEvents: "none",
                  whiteSpace: "nowrap",
                  zIndex: 1,
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: "bold" }}>
                  {hovered.label}
                </Typography>
                <Typography variant="caption" sx={{ display: "block" }} color="text.secondary">
                  {Math.round((hovered.value / totals.totalPasses) * 100)}% ({hovered.value})
                </Typography>
              </Box>
            )}
          </Box>

          {/* Every known category, even ones at 0 right now - so the color key stays consistent across different filters. */}
          <Stack sx={{ gap: 0.5 }}>
            {allSlices.map((slice) => (
              <Stack key={slice.key} direction="row" sx={{ gap: 1, alignItems: "center" }}>
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: slice.color, flexShrink: 0 }} />
                <Typography variant="body2">
                  {slice.label} - {Math.round((slice.value / totals.totalPasses) * 100)}% ({slice.value})
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {noDataLabel}
        </Typography>
      )}
    </Card>
  );
};

export default CompetitionOutcomePie;
