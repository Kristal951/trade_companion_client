import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Sector,
} from "recharts";

/* ---------------- COLORS ---------------- */
const PALETTE = [
  "#818CF8",
  "#34D399",
  "#F59E0B",
  "#EF4444",
  "#60A5FA",
  "#A78BFA",
  "#F472B6",
  "#22C55E",
];

const hashStringToIndex = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

const getColor = (label: string) =>
  PALETTE[hashStringToIndex(label) % PALETTE.length];

/* ---------------- COMPONENT ---------------- */
const InstrumentPieChart = ({
  instrumentDistribution,
}: {
  instrumentDistribution: { name: string; value: number }[];
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const total = useMemo(() => {
    return instrumentDistribution.reduce((a, b) => a + b.value, 0);
  }, [instrumentDistribution]);

  const onEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  /* ---------------- ACTIVE SLICE (POP OUT) ---------------- */
  const renderActiveShape = (props: any) => {
    const {
      cx,
      cy,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      payload,
      percent,
      value,
    } = props;

    return (
      <g>
        {/* LABEL */}
        <text
          x={cx}
          y={cy - 10}
          textAnchor="middle"
          fill="var(--color-text)"
          className="font-bold"
        >
          {payload.name}
        </text>

        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          fill="var(--color-text-mid)"
        >
          {(percent * 100).toFixed(1)}%
        </text>

        {/* POP OUT SLICE */}
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 12} // 👈 POP OUT EFFECT
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke="var(--color-surface)"
          strokeWidth={2}
        />
      </g>
    );
  };

  return (
    <div className="w-full">
      {/* CHART */}
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={instrumentDistribution}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={90} // FULL PIE
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            onMouseEnter={onEnter}
            stroke="none"
          >
            {instrumentDistribution.map((entry) => (
              <Cell key={entry.name} fill={getColor(entry.name)} />
            ))}
          </Pie>

          <Tooltip
            formatter={(value: any, name: any) => {
              const percent = ((value / total) * 100).toFixed(1);
              return [`${value} trades (${percent}%)`, name];
            }}
            contentStyle={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border-dark)",
              borderRadius: "10px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* LEGEND */}
      <div className="flex flex-col gap-2 mt-4">
        {instrumentDistribution.map((item) => {
          const percent = ((item.value / total) * 100).toFixed(1);

          return (
            <div
              key={item.name}
              className="flex items-center justify-between text-sm"
            >
              {/* LEFT */}
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getColor(item.name) }}
                />
                <span className="text-dark-text font-medium">
                  {item.name}
                </span>
              </div>

              {/* RIGHT */}
              <span className="text-mid-text">
                {item.value} ({percent}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InstrumentPieChart;