import { differenceInDays } from 'date-fns';

export type Segment = 'platinum' | 'gold' | 'regular' | 'returning' | 'onetime';
export type Status = 'active' | 'cooling' | 'cold' | 'lost' | 'dead';
export type DueStatus = 'no_pattern' | 'not_yet' | 'due_now' | 'overdue' | 'very_overdue';

export function getSegment(orderCount: number): Segment {
  if (orderCount >= 10) return 'platinum';
  if (orderCount >= 5) return 'gold';
  if (orderCount >= 3) return 'regular';
  if (orderCount === 2) return 'returning';
  return 'onetime';
}

export function getStatus(daysSinceLast: number): Status {
  if (daysSinceLast <= 30) return 'active';
  if (daysSinceLast <= 60) return 'cooling';
  if (daysSinceLast <= 90) return 'cold';
  if (daysSinceLast <= 180) return 'lost';
  return 'dead';
}

export function calcAvgFreq(orderDates: Date[]): number | null {
  if (orderDates.length < 2) return null;
  const sorted = [...orderDates].sort((a, b) => a.getTime() - b.getTime());
  const lifespan = differenceInDays(sorted[sorted.length - 1]!, sorted[0]!);
  if (lifespan === 0) return null;
  return Math.round((lifespan / (orderDates.length - 1)) * 10) / 10;
}

export function getDueStatus(daysSince: number, avgFreq: number | null): DueStatus {
  if (avgFreq == null || avgFreq <= 0) return 'no_pattern';
  const ratio = daysSince / avgFreq;
  if (ratio < 0.8) return 'not_yet';
  if (ratio < 1.2) return 'due_now';
  if (ratio < 2.0) return 'overdue';
  return 'very_overdue';
}

export const SEGMENT_LABEL_TH: Record<Segment, string> = {
  platinum: 'แพลตตินั่ม',
  gold: 'โกลด์',
  regular: 'ประจำ',
  returning: 'กลับมาซื้อซ้ำ',
  onetime: 'ซื้อครั้งเดียว',
};

export const STATUS_LABEL_TH: Record<Status, string> = {
  active: 'แอคทีฟ',
  cooling: 'เริ่มเงียบ',
  cold: 'เย็น',
  lost: 'หายไป',
  dead: 'ยุติ',
};
