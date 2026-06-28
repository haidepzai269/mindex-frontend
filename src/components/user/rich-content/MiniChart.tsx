"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

interface DataPoint {
  label: string;
  value: number;
}

interface MiniChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
  formatValue?: (value: number) => string;
}

export function MiniChart({
  data,
  color = "#3b82f6",
  height = 80,
  formatValue,
}: MiniChartProps) {
  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <XAxis dataKey="label" hide />
        <YAxis domain={["dataMin - 1", "dataMax + 1"]} hide />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            fontSize: "12px",
            color: "hsl(var(--popover-foreground))",
          }}
          formatter={(value) => [
            formatValue ? formatValue(Number(value)) : value,
          ]}
          labelStyle={{ color: "hsl(var(--muted-foreground))", fontSize: "11px" }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3, strokeWidth: 0, fill: color }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
