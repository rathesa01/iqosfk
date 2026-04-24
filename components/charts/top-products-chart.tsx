'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Row = { name: string; pieces: number; amount: number };

const COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
];

export function TopProductsChart({ data }: { data: Row[] }) {
  const trimmed = data.map((d) => ({
    ...d,
    short: d.name.length > 24 ? d.name.slice(0, 24) + '…' : d.name,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, trimmed.length * 32 + 40)}>
      <BarChart data={trimmed} layout="vertical" margin={{ top: 8, right: 24, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
        <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} />
        <YAxis
          type="category"
          dataKey="short"
          tickLine={false}
          axisLine={false}
          width={170}
          fontSize={11}
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
            if (name === 'pieces') return [v.toLocaleString('th-TH'), 'ชิ้น'];
            return [String(v), String(name ?? '')];
          }}
        />
        <Bar dataKey="pieces" radius={[0, 6, 6, 0]} barSize={20}>
          {trimmed.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
