'use client';

import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';

type Cell = { weekStart: string; dow: number; pieces: number; amount: number };

const DOW_LABEL = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];

export function Heatmap({ data }: { data: Cell[] }) {
  if (data.length === 0) {
    return (
      <div className="text-muted-foreground flex h-[180px] items-center justify-center text-sm">
        ยังไม่มีข้อมูล
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.pieces), 1);
  const weeks = Array.from(new Set(data.map((d) => d.weekStart))).sort();
  const cellMap = new Map<string, Cell>();
  data.forEach((d) => cellMap.set(`${d.weekStart}|${d.dow}`, d));

  return (
    <div className="overflow-x-auto">
      <div className="inline-grid gap-1" style={{ gridTemplateColumns: `auto repeat(${weeks.length}, minmax(28px, 1fr))` }}>
        {/* header row */}
        <div />
        {weeks.map((w) => (
          <div
            key={w}
            className="text-muted-foreground text-center text-[10px]"
            title={format(parseISO(w), 'd MMM yyyy', { locale: th })}
          >
            {format(parseISO(w), 'd/M')}
          </div>
        ))}

        {/* day rows */}
        {DOW_LABEL.map((label, idx) => (
          <div key={label} className="contents">
            <div className="text-muted-foreground pr-1 text-right text-[11px]">{label}</div>
            {weeks.map((w) => {
              const cell = cellMap.get(`${w}|${idx + 1}`);
              const intensity = cell ? cell.pieces / max : 0;
              const bg = cell
                ? `color-mix(in oklab, var(--color-chart-1) ${Math.max(8, intensity * 95)}%, transparent)`
                : 'var(--color-muted)';
              return (
                <div
                  key={w + idx}
                  className="aspect-square rounded-sm"
                  style={{ background: bg }}
                  title={
                    cell
                      ? `${format(parseISO(w), 'd MMM', { locale: th })} (${label}) — ${cell.pieces} ชิ้น · ฿${cell.amount.toLocaleString('th-TH')}`
                      : `${format(parseISO(w), 'd MMM', { locale: th })} (${label}) — ไม่มีออเดอร์`
                  }
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
