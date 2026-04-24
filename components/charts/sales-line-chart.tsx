'use client';

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format, parseISO } from 'date-fns';

type Row = {
  day: string;
  orderCount: number;
  pieces: number;
  amount: number;
  newCustomers: number;
};

export function SalesLineChart({ data }: { data: Row[] }) {
  const chartData = data.map((d) => ({
    ...d,
    label: format(parseISO(d.day), 'd/M'),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="amt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
            <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
        <YAxis
          yAxisId="left"
          tickLine={false}
          axisLine={false}
          fontSize={11}
          tickFormatter={(v) => `฿${(v as number).toLocaleString('th-TH')}`}
          width={70}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tickLine={false}
          axisLine={false}
          fontSize={11}
          width={30}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--color-popover)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value, name) => {
            const v = Number(value ?? 0);
            if (name === 'amount') return [`฿${v.toLocaleString('th-TH')}`, 'ยอดขาย'];
            if (name === 'orderCount') return [String(v), 'จำนวนออเดอร์'];
            if (name === 'newCustomers') return [String(v), 'ลูกค้าใหม่'];
            return [String(v), String(name ?? '')];
          }}
          labelFormatter={(label) => label}
        />
        <Legend
          formatter={(v) =>
            v === 'amount' ? 'ยอดขาย' : v === 'orderCount' ? 'จำนวนออเดอร์' : 'ลูกค้าใหม่'
          }
          wrapperStyle={{ fontSize: 12 }}
        />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="amount"
          stroke="var(--color-chart-1)"
          fill="url(#amt)"
          strokeWidth={2}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="orderCount"
          stroke="var(--color-chart-2)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="newCustomers"
          stroke="var(--color-chart-3)"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
