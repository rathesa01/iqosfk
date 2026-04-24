'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts';

type Row = { key: string; count: number; label: string; color: string };

export function DistributionChart({
  data,
  donut = false,
}: {
  data: Row[];
  donut?: boolean;
}) {
  if (data.length === 0) {
    return (
      <div className="text-muted-foreground flex h-[220px] items-center justify-center text-sm">
        ยังไม่มีข้อมูล
      </div>
    );
  }
  const total = data.reduce((s, r) => s + r.count, 0);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="label"
          cx="50%"
          cy="50%"
          innerRadius={donut ? 55 : 0}
          outerRadius={90}
          paddingAngle={2}
          stroke="var(--color-background)"
          strokeWidth={2}
        >
          {data.map((row) => (
            <Cell key={row.key} fill={row.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: 'var(--color-popover)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value, name) => {
            const v = Number(value ?? 0);
            const pct = total > 0 ? ((v / total) * 100).toFixed(1) : '0';
            return [`${v} (${pct}%)`, String(name ?? '')];
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          iconType="circle"
          formatter={(v) => v as string}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
