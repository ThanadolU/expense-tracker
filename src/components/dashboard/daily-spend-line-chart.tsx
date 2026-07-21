"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "@/lib/money";

export type DailySpendChartPoint = {
  day: number;
  date: string;
  label: string;
  total: number;
};

type DailySpendLineChartProps = {
  data: DailySpendChartPoint[];
  currency: string;
  monthLabel: string;
};

type TooltipPayload = {
  value?: number;
  payload?: DailySpendChartPoint;
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

  const point = payload[0]?.payload;
  if (!point) {
    return null;
  }

  return (
    <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <p className="font-medium text-zinc-900 dark:text-zinc-50">{point.date}</p>
      <p className="text-zinc-600 dark:text-zinc-400">
        {formatMoney(point.total, currency)}
      </p>
    </div>
  );
}

export function DailySpendLineChart({
  data,
  currency,
  monthLabel,
}: DailySpendLineChartProps) {
  if (data.length === 0) {
    return null;
  }

  // Only days with data — show all labels when few points
  const tickInterval = data.length > 15 ? 2 : 0;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 space-y-0.5">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Daily spending
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Days with expenses in {monthLabel}
          {data.length > 0
            ? ` (day ${data[0].day}–${data[data.length - 1].day})`
            : ""}
        </p>
      </div>
      <div className="h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval={tickInterval}
              label={{
                value: "Day",
                position: "insideBottom",
                offset: -2,
                fontSize: 11,
              }}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
              }
            />
            <Tooltip content={<ChartTooltip currency={currency} />} />
            <Line
              type="monotone"
              dataKey="total"
              name="Spent"
              stroke="#2563eb"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#2563eb", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#1d4ed8" }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
