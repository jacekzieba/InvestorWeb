"use client";

import { CHART_COLORS, COLORS, TYPOGRAPHY } from "@/lib/design-tokens";

type Slice = { label: string; percent: number };

const PALETTE = [
  CHART_COLORS.portfolio,
  CHART_COLORS.comparison,
  CHART_COLORS.benchmark,
  CHART_COLORS.contribution,
  CHART_COLORS.cash,
  CHART_COLORS.crypto,
  COLORS.plum,
];

export function AllocationDonut({ slices }: { slices: Slice[] }) {
  if (!slices || slices.length === 0) return null;

  const SIZE = 168;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const THICK = 24;
  const r = (SIZE - THICK) / 2;
  const circ = 2 * Math.PI * r;
  const total = slices.reduce((s, g) => s + g.percent, 0) || 100;

  let offset = 0;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center", padding: "6px 0 14px" }}>
        <svg width={SIZE} height={SIZE}>
          {slices.map((slice, i) => {
            const frac = slice.percent / total;
            const dash = frac * circ - 3;
            const sp = circ - dash;
            const rot = (offset / total) * 360 - 90;
            offset += slice.percent;
            const color = PALETTE[i % PALETTE.length];
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={color}
                strokeWidth={THICK}
                strokeDasharray={`${Math.max(0, dash)} ${sp}`}
                strokeLinecap="butt"
                style={{
                  transform: `rotate(${rot}deg)`,
                  transformOrigin: `${cx}px ${cy}px`,
                }}
              />
            );
          })}
          {/* Center label */}
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize="10" fill={COLORS.subtle} fontWeight="600" letterSpacing="0.06em" fontFamily={TYPOGRAPHY.system}>
            ALOKACJA
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize="18" fill={COLORS.text} fontWeight="700" fontFamily={TYPOGRAPHY.system}>
            {slices.length}
          </text>
          <text x={cx} y={cy + 26} textAnchor="middle" fontSize="9.5" fill={COLORS.subtle} fontFamily={TYPOGRAPHY.system}>
            klas
          </text>
        </svg>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {slices.map((slice, i) => {
          const color = PALETTE[i % PALETTE.length];
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 2,
                  background: color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  flex: 1,
                  fontSize: 12.5,
                  color: COLORS.text,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {slice.label}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: COLORS.text,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {slice.percent.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
