import React, { useEffect, useState } from "react";
import { Box, Card, Checkbox, FormControlLabel, Stack, Typography, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { CompetitionDogStats } from "../helpers/types";

const DEFAULT_WIDTH = 600;
// Wide enough that the rotated x-axis labels below never collide - past this many points the chart scrolls instead.
const MIN_POINT_SPACING = 52;
// Extra left room so the leftmost rotated label doesn't run off the SVG.
const LEFT_MARGIN = 80;
const RIGHT_MARGIN = 20;
const TOP_MARGIN = 20;
// Deep enough for the -35deg labels (name + optional club sub-label).
const BOTTOM_MARGIN = 104;
const LABEL_ANGLE = -35;
const PLOT_HEIGHT = 220;
const TICK_COUNT = 5;
const POINT_RADIUS = 4;
// Rotated x-axis labels are truncated to this many chars (full text stays in an SVG <title>).
const LABEL_MAX_CHARS = 12;
const truncate = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);
const CHAR_WIDTH = 6.2;

export interface MetricSeriesDef {
  key: string;
  label: string;
  color: string;
  getValue: (row: CompetitionDogStats) => number | null;
}

// A "nice" round axis top close to the real max, instead of always rounding up to the next multiple of 10 - a max of 3 gets a top of 4, not 10.
const computeNiceMax = (rawMax: number) => {
  const safeMax = Math.max(rawMax, 1);
  const roughStep = safeMax / TICK_COUNT;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const residual = roughStep / magnitude;
  const niceStep = residual <= 1 ? magnitude : residual <= 2 ? 2 * magnitude : residual <= 5 ? 5 * magnitude : 10 * magnitude;
  const rounded = Math.ceil(safeMax / niceStep) * niceStep;

  return rounded > safeMax ? rounded : rounded + niceStep;
};

interface CompetitionMetricsLineChartProps {
  dogs: CompetitionDogStats[];
  title: string;
  noDataLabel: string;
  series: MetricSeriesDef[];
  // Fixed at 100 for a percent chart - omit to size the axis to the data, like the raw-count chart does.
  fixedMax?: number;
}

// Paint order for the area fills, back to front: passes behind everything, faults in front of everything.
const AREA_RANK: Record<string, number> = { passes: 1, cleanCount: 2, effectiveness: 2, okCount: 3, okOfAll: 3, faultCount: 4, faultRate: 4 };
const areaRankOf = (key: string) => AREA_RANK[key] ?? 1;

// Ok is always a subset of clean/effectiveness, so its band sits below - otherwise ok's own fill buries clean/effectiveness's color whenever they're close.
const AREA_LOWER_BOUND_KEY: Record<string, string> = { cleanCount: "okCount", effectiveness: "okOfAll" };

// Hand-drawn multi-line chart: one line per metric, one point per dog, all sharing a single Y axis for a quick visual comparison.
const CompetitionMetricsLineChart = ({ dogs, title, noDataLabel, series, fixedMax }: CompetitionMetricsLineChartProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  // A ref callback in state, not a plain ref - the box only mounts once there's data, and a plain ref's mount-only effect would miss that later mount.
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  // Measured rather than percentage-scaled, so points/circles/text stay pixel-accurate at any card width instead of stretching.
  const [containerWidth, setContainerWidth] = useState(DEFAULT_WIDTH);

  useEffect(() => {
    if (!containerEl) return undefined;

    const observer = new ResizeObserver((entries) => setContainerWidth(entries[0].contentRect.width));

    observer.observe(containerEl);

    return () => observer.disconnect();
  }, [containerEl]);

  const namedDogs = [...dogs.filter((dog) => dog.name)].sort((a, b) => (a.name as string).localeCompare(b.name as string));
  const [hovered, setHovered] = useState<{ seriesKey: string; dogIndex: number } | null>(null);
  // Legend entries toggle their own series off - the axis then rescales to whatever is left on.
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());
  const toggleSeries = (key: string) =>
    setHiddenKeys((current) => {
      const next = new Set(current);

      if (next.has(key)) next.delete(key);
      else next.add(key);

      return next;
    });
  const visibleSeries = series.filter((entry) => !hiddenKeys.has(entry.key));

  const rawMax = Math.max(1, ...visibleSeries.flatMap((entry) => namedDogs.map((dog) => entry.getValue(dog)).filter((value): value is number => value !== null)));
  // fixedMax is a ceiling, not a fixed height - the axis still shrinks to fit when the visible data sits well below it.
  const niceMax = Math.min(fixedMax ?? Infinity, computeNiceMax(rawMax));
  const height = TOP_MARGIN + PLOT_HEIGHT + BOTTOM_MARGIN;
  // Below this many dogs it fills the full measured width; past it, points keep their minimum spacing and the chart scrolls instead of cramming.
  const neededWidth = LEFT_MARGIN + RIGHT_MARGIN + Math.max(namedDogs.length - 1, 0) * MIN_POINT_SPACING;
  const chartWidth = Math.max(containerWidth, neededWidth);
  const plotWidth = chartWidth - LEFT_MARGIN - RIGHT_MARGIN;
  const isScrollable = chartWidth > containerWidth;

  // Evenly spread across the chart's own width - a single dog just sits in the middle of it.
  const xFor = (dogIndex: number) => (namedDogs.length > 1 ? LEFT_MARGIN + (dogIndex / (namedDogs.length - 1)) * plotWidth : LEFT_MARGIN + plotWidth / 2);
  const yFor = (value: number) => TOP_MARGIN + PLOT_HEIGHT * (1 - value / niceMax);

  // Breaks the line at any dog this metric has no value for, instead of skipping straight over the gap.
  const pathFor = (getValue: (row: CompetitionDogStats) => number | null) => {
    let path = "";
    let drawing = false;

    namedDogs.forEach((dog, dogIndex) => {
      const value = getValue(dog);

      if (value === null) {
        drawing = false;
        return;
      }

      path += `${drawing ? "L" : "M"} ${xFor(dogIndex)} ${yFor(value)} `;
      drawing = true;
    });

    return path.trim();
  };

  // Same gap-breaking rule as the line, closed down to zero or (given a lower-bound sibling) that sibling's own curve, so fills sit edge-to-edge.
  const areaPathFor = (getValue: (row: CompetitionDogStats) => number | null, lowerGetValue?: (row: CompetitionDogStats) => number | null) => {
    let path = "";
    let upperSegment: { x: number; y: number }[] = [];
    let lowerSegment: { x: number; y: number }[] = [];

    const flushSegment = () => {
      if (upperSegment.length === 0) return;

      path += `M ${upperSegment[0].x} ${upperSegment[0].y} `;
      upperSegment.slice(1).forEach((point) => {
        path += `L ${point.x} ${point.y} `;
      });
      [...lowerSegment].reverse().forEach((point) => {
        path += `L ${point.x} ${point.y} `;
      });
      path += "Z ";
      upperSegment = [];
      lowerSegment = [];
    };

    namedDogs.forEach((dog, dogIndex) => {
      const value = getValue(dog);

      if (value === null) {
        flushSegment();
        return;
      }

      // Clamped so a lower-bound value ever exceeding its own upper value (shouldn't happen, but data is data) can't invert the band.
      const lowerValue = Math.min(lowerGetValue ? (lowerGetValue(dog) ?? 0) : 0, value);

      upperSegment.push({ x: xFor(dogIndex), y: yFor(value) });
      lowerSegment.push({ x: xFor(dogIndex), y: yFor(lowerValue) });
    });
    flushSegment();

    return path.trim();
  };

  const orderedForAreas = [...visibleSeries].sort((a, b) => areaRankOf(a.key) - areaRankOf(b.key));
  const lowerBoundGetValueFor = (key: string) => visibleSeries.find((entry) => entry.key === AREA_LOWER_BOUND_KEY[key])?.getValue;

  const hoveredDog = hovered && !hiddenKeys.has(hovered.seriesKey) ? namedDogs[hovered.dogIndex] : null;
  const hoveredSeries = hovered ? series.find((entry) => entry.key === hovered.seriesKey) : undefined;
  const hoveredValue = hoveredDog && hoveredSeries ? hoveredSeries.getValue(hoveredDog) : null;

  // The tooltip is drawn inside the SVG and clamped to the plot box, so the scroll container can never clip it.
  const tooltip = (() => {
    if (!hovered || !hoveredDog || !hoveredSeries || hoveredValue === null) return null;

    const line1 = `${hoveredDog.name} · ${hoveredSeries.label}`;
    const line2 = String(Math.round(hoveredValue));
    const width = Math.min(Math.max(line1.length, line2.length) * CHAR_WIDTH + 16, PLOT_HEIGHT + 120);
    const height = 34;
    const anchorX = xFor(hovered.dogIndex);
    const anchorY = yFor(hoveredValue);
    const below = anchorY - height - 10 < TOP_MARGIN;
    const x = Math.min(Math.max(anchorX - width / 2, LEFT_MARGIN), chartWidth - RIGHT_MARGIN - width);
    const y = below ? anchorY + 10 : anchorY - height - 10;

    return { x, y, width, height, line1, line2 };
  })();

  return (
    <Card variant="outlined" sx={{ padding: 2, display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography variant="subtitle1">{title}</Typography>

      {namedDogs.length > 0 ? (
        <>
          {/* Bleeds slightly into the card's own padding for a bit more real width to spread points over - the measured width picks this up automatically. */}
          <Box ref={setContainerEl} sx={{ position: "relative", mx: "-12px", overflowX: "auto", pb: isScrollable ? "10px" : 0 }}>
            <svg width={chartWidth} height={height} viewBox={`0 0 ${chartWidth} ${height}`}>
              {Array.from({ length: TICK_COUNT + 1 }, (_, tick) => {
                const value = (niceMax / TICK_COUNT) * tick;
                const y = yFor(value);

                return (
                  <g key={tick}>
                    <line x1={LEFT_MARGIN} y1={y} x2={chartWidth - RIGHT_MARGIN} y2={y} stroke={theme.palette.divider} strokeWidth={1} />
                    <text x={LEFT_MARGIN - 8} y={y} textAnchor="end" dominantBaseline="middle" fontSize={10} fill={theme.palette.text.secondary}>
                      {Math.round(value)}
                    </text>
                  </g>
                );
              })}

              {/* Fill under each series' own curve, painted in a fixed back-to-front order rather than the series' own list order. */}
              {orderedForAreas.map((entry) => (
                <path
                  key={`area-${entry.key}`}
                  d={areaPathFor(entry.getValue, lowerBoundGetValueFor(entry.key))}
                  fill={entry.color}
                  fillOpacity={0.25}
                  stroke="none"
                />
              ))}

              {namedDogs.map((dog, dogIndex) => {
                const labelX = xFor(dogIndex);
                const labelY = TOP_MARGIN + PLOT_HEIGHT + 14;

                return (
                  <text
                    key={dog.dogId}
                    x={labelX}
                    y={labelY}
                    textAnchor="end"
                    fill={theme.palette.text.primary}
                    transform={`rotate(${LABEL_ANGLE} ${labelX} ${labelY})`}
                  >
                    <title>{dog.nameSubLabel ? `${dog.name} - ${dog.nameSubLabel}` : dog.name}</title>

                    <tspan x={labelX} fontSize={11}>
                      {truncate(dog.name ?? "", LABEL_MAX_CHARS)}
                    </tspan>

                    {/* Club (opponent rows) or running order (lineup rows) - a size step down from the name. */}
                    {dog.nameSubLabel && (
                      <tspan x={labelX} dy={12} fontSize={9} fill={theme.palette.text.secondary}>
                        {truncate(dog.nameSubLabel, LABEL_MAX_CHARS)}
                      </tspan>
                    )}
                  </text>
                );
              })}

              {visibleSeries.map((entry) => (
                <path key={entry.key} d={pathFor(entry.getValue)} fill="none" stroke={entry.color} strokeWidth={2} />
              ))}

              {visibleSeries.map((entry) =>
                namedDogs.map((dog, dogIndex) => {
                  const value = entry.getValue(dog);

                  if (value === null) return null;

                  const isHovered = hovered?.seriesKey === entry.key && hovered.dogIndex === dogIndex;

                  return (
                    <circle
                      key={`${entry.key}-${dog.dogId}`}
                      cx={xFor(dogIndex)}
                      cy={yFor(value)}
                      r={isHovered ? POINT_RADIUS + 2 : POINT_RADIUS}
                      fill={entry.color}
                      stroke={theme.palette.background.paper}
                      strokeWidth={1.5}
                      style={{ cursor: "pointer" }}
                      onMouseEnter={() => setHovered({ seriesKey: entry.key, dogIndex })}
                      onMouseLeave={() => setHovered(null)}
                    />
                  );
                })
              )}

              {tooltip && (
                <g pointerEvents="none">
                  <rect
                    x={tooltip.x}
                    y={tooltip.y}
                    width={tooltip.width}
                    height={tooltip.height}
                    rx={4}
                    fill={theme.palette.background.paper}
                    stroke={theme.palette.divider}
                  />
                  <text x={tooltip.x + 8} y={tooltip.y + 14} fontSize={10} fontWeight="bold" fill={theme.palette.text.primary}>
                    {tooltip.line1}
                  </text>
                  <text x={tooltip.x + 8} y={tooltip.y + 27} fontSize={10} fill={theme.palette.text.secondary}>
                    {tooltip.line2}
                  </text>
                </g>
              )}
            </svg>
          </Box>

          {isScrollable && (
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
              ← {t("pages.ejsStats.chartScrollHint")} →
            </Typography>
          )}

          <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
            {series.map((entry) => (
              <FormControlLabel
                key={entry.key}
                sx={{ mr: 1 }}
                control={
                  <Checkbox
                    size="small"
                    checked={!hiddenKeys.has(entry.key)}
                    onChange={() => toggleSeries(entry.key)}
                    sx={{ paddingY: 0, color: entry.color, "&.Mui-checked": { color: entry.color } }}
                  />
                }
                label={<Typography variant="body2">{entry.label}</Typography>}
              />
            ))}
          </Stack>
        </>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {noDataLabel}
        </Typography>
      )}
    </Card>
  );
};

export default CompetitionMetricsLineChart;
