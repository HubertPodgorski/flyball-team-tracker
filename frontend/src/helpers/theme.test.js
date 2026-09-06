import { describe, expect, it } from "vitest";
import theme from "./theme";

describe("theme", () => {
  it("is dark mode", () => {
    expect(theme.palette.mode).toBe("dark");
  });
});

// WCAG relative luminance / contrast ratio - guards against a color that
// reads fine on paper but fails against this app's actual dark background.
const relativeLuminance = (hex) => {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrastRatio = (hexA, hexB) => {
  const [lighter, darker] = [relativeLuminance(hexA), relativeLuminance(hexB)].sort((a, b) => b - a);

  return (lighter + 0.05) / (darker + 0.05);
};

describe("palette contrast against the dark background", () => {
  it("error.main meets WCAG AA (4.5:1) for body text on background.paper", () => {
    const ratio = contrastRatio(theme.palette.error.main, theme.palette.background.paper);

    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});

describe("MuiDataGrid override", () => {
  it("matches the app's frosted-glass surface treatment, not an opaque default", () => {
    const rootStyles = theme.components.MuiDataGrid.styleOverrides.root({ theme });

    expect(rootStyles.backgroundColor).not.toBe(theme.palette.background.paper);
    expect(rootStyles.backdropFilter).toContain("blur");
  });
});
