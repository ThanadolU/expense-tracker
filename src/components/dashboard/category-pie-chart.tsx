"use client";

import {
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatMoney } from "@/lib/money";

export type PieSlice = {
  name: string;
  value: number;
  /** Slice color — preferred over deprecated <Cell /> */
  fill: string;
};

type CategoryPieChartProps = {
  data: Array<{ name: string; value: number }>;
  currency: string;
};

/** Vibrant, high-contrast slice colors (cycles if more categories than colors). */
const COLORS = [
  "#2563eb", // blue-600
  "#db2777", // pink-600
  "#059669", // emerald-600
  "#ea580c", // orange-600
  "#7c3aed", // violet-600
  "#0891b2", // cyan-600
  "#ca8a04", // yellow-600
  "#dc2626", // red-600
  "#4f46e5", // indigo-600
  "#16a34a", // green-600
  "#c026d3", // fuchsia-600
  "#0d9488", // teal-600
];

type TooltipPayload = {
  name?: string;
  value?: number;
  payload?: PieSlice;
};

function ChartTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  currency: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0];
  const name = item.name ?? item.payload?.name ?? "";
  const value = item.value ?? item.payload?.value ?? 0;

  return (
    <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <p className="font-medium text-zinc-900 dark:text-zinc-50">{name}</p>
      <p className="text-zinc-600 dark:text-zinc-400">
        {formatMoney(value, currency)}
      </p>
    </div>
  );
}

export function CategoryPieChart({ data, currency }: CategoryPieChartProps) {
  if (data.length === 0) {
    return null;
  }

  // Put color on each point instead of using deprecated <Cell />
  const chartData: PieSlice[] = data.map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length],
  }));

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Share by category
      </h3>
      <div className="mx-auto h-64 w-full max-w-md sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="42%"
              outerRadius="78%"
              paddingAngle={0}
              stroke="none"
            />
            <Tooltip content={<ChartTooltip currency={currency} />} />
            <Legend
              height={36}
              wrapperStyle={{ fontSize: "12px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
