import type { CSSProperties } from "react";

export const COLORS = {
  bg: "#F4F7F2",
  surface: "#FFFFFF",
  surfaceAlt: "#F0F3EE",
  border: "#E3E7DF",
  text: "#1C3144",
  textMuted: "#6A7585",
  green: "#5E7B4F",
  profit: "#207A50",
  loss: "#A9443C",
  cash: "#56677D",
  bonds: "#766313",
  equity: "#2F669C",
  forest: "#4F6658",
  accent: "#2C4C6B",
  neutral: "#A0ADB8",
  gold: "#B69A57",
  crypto: "#7E5AA5",
  other: "#8E7A64",
  plum: "#9A6B83",
  white: "#FFFFFF",
  overlay: "rgba(28,49,68,0.32)",
  subtle: "rgba(106,117,133,0.72)",
  muted: "rgba(106,117,133,0.88)",
  lineSoft: "rgba(227,231,223,0.9)",
  lineSofter: "rgba(227,231,223,0.55)",
  accentSoft: "rgba(44,76,107,0.10)",
  textSoft: "rgba(28,49,68,0.05)",
  textSofter: "rgba(28,49,68,0.03)",
} as const;

export const CHART_COLORS = {
  portfolio: COLORS.accent,
  comparison: COLORS.equity,
  benchmark: COLORS.forest,
  contribution: COLORS.bonds,
  positive: COLORS.profit,
  negative: COLORS.loss,
  cash: COLORS.cash,
  neutral: COLORS.neutral,
  crypto: COLORS.crypto,
  other: COLORS.other,
  categorical: [
    COLORS.accent,
    COLORS.equity,
    COLORS.forest,
    COLORS.bonds,
    COLORS.cash,
    COLORS.neutral,
    "#8A96A3",
    COLORS.other,
    "#7A8B84",
  ],
} as const;

export const TYPOGRAPHY = {
  system:
    "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Segoe UI', system-ui, sans-serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
} as const;

export const SHADOWS = {
  card: "0 1px 0 rgba(28,49,68,0.02), 0 6px 16px rgba(28,49,68,0.06)",
  cardStrong: "0 10px 28px rgba(28,49,68,0.10)",
  button: "0 3px 10px rgba(28,49,68,0.14), inset 0 0.5px 0 rgba(255,255,255,0.18)",
  tooltip: "0 8px 20px rgba(28,49,68,0.14)",
} as const;

export const SURFACES = {
  glassCard: {
    background: COLORS.surface,
    borderRadius: 16,
    border: `0.5px solid ${COLORS.border}`,
    boxShadow: SHADOWS.card,
  } satisfies CSSProperties,
  glassPanel: {
    background: "rgba(255,255,255,0.94)",
    backdropFilter: "blur(22px) saturate(140%)",
    WebkitBackdropFilter: "blur(22px) saturate(140%)",
    border: `0.5px solid ${COLORS.border}`,
    boxShadow: SHADOWS.cardStrong,
  } satisfies CSSProperties,
} as const;
