import { differenceInDays, format } from 'date-fns';
import { TZDate } from '@date-fns/tz';

export const TIMEZONE = 'Asia/Bangkok';

export function nowBkk(): TZDate {
  return new TZDate(new Date(), TIMEZONE);
}

export function toBkk(date: Date | string | number): TZDate {
  return new TZDate(date instanceof Date ? date : new Date(date), TIMEZONE);
}

export function formatBkk(date: Date | string | number, pattern = 'yyyy-MM-dd HH:mm') {
  return format(toBkk(date), pattern);
}

export function daysBetween(a: Date | string | number, b: Date | string | number) {
  return differenceInDays(toBkk(a), toBkk(b));
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  // Drop leading "66" country code, ensure leading "0"
  const trimmed = digits.startsWith('66') ? digits.slice(2) : digits;
  return trimmed.startsWith('0') ? trimmed : `0${trimmed}`;
}
