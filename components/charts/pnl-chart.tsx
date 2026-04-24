'use client';

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Row = {
  bucket: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
};

export function PnlChart({ data }: { data: Row[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="bucket" tickLine={false} axisLine={false} fontSize={11} />
        <YAxis
          tickLine={false}
          axisLine={false}
          fontSize={11}
          tickFormatter={(v) => `฿${(v as number).toLocaleString('th-TH')}`}
          width={70}
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
            const labels: Record<string, string> = {
              revenue: 'รายได้',
              cogs: 'ทุน',
              expenses: 'ค่าใช้จ่ายอื่น',
              netProfit: 'กำไรสุทธิ',
            };
            return [`฿${v.toLocaleString('th-TH')}`, labels[String(name)] ?? String(name)];
          }}
        />
        <Legend
          formatter={(v) => {
            const labels: Record<string, string> = {
              revenue: 'รายได้',
              cogs: 'ทุน',
              expenses: 'ค่าใช้จ่ายอื่น',
              netProfit: 'กำไรสุทธิ',
            };
            return labels[String(v)] ?? String(v);
          }}
          wrapperStyle={{ fontSize: 12 }}
        />
        <Bar dataKey="revenue" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="cogs" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenses" fill="var(--color-chart-4)" radius={[4, 4, 0, 0]} />
        <Line
          type="monotone"
          dataKey="netProfit"
          stroke="var(--color-chart-2)"
          strokeWidth={2.5}
          dot
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
