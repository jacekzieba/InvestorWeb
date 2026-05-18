"use client";

import { useId } from "react";
import { COLORS } from "@/lib/design-tokens";

export function Sparkline({
  data,
  width = 100,
  height = 28,
  color = COLORS.profit,
  strokeWidth = 1.6,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const uid = useId();
  if (!data || data.length < 2) return null;

  const mn = Math.min(...data);
  const mx = Math.max(...data);
  const rng = mx - mn || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - mn) / rng) * height}`)
    .join(" ");
  const gradId = `spark-${uid.replace(/:/g, "")}`;

  return (
    <svg width={width} height={height} style={{ overflow: "visible", display: "block" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M0,${height} L${pts} L${width},${height} Z`} fill={`url(#${gradId})`} />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
