/**
 * Convert a row array into a CSV string.
 * Handles quoting + UTF-8 BOM for Excel compatibility (Thai characters).
 */
export function toCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: { key: keyof T; header: string }[],
): string {
  const escape = (v: unknown): string => {
    if (v == null) return '';
    if (v instanceof Date) return v.toISOString();
    const s = String(v);
    if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const head = columns.map((c) => escape(c.header)).join(',');
  const body = rows
    .map((r) => columns.map((c) => escape(r[c.key])).join(','))
    .join('\r\n');

  return '\uFEFF' + head + '\r\n' + body + '\r\n';
}

export function csvResponse(filename: string, csv: string): Response {
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
