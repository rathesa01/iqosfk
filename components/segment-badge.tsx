import { Badge } from '@/components/ui/badge';
import {
  SEGMENT_LABEL_TH,
  STATUS_LABEL_TH,
  type Segment,
  type Status,
} from '@/lib/analytics/customer';
import { cn } from '@/lib/utils';

const SEGMENT_CLASS: Record<Segment, string> = {
  platinum: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
  gold: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  regular: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  returning: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  onetime: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
};

const STATUS_CLASS: Record<Status, string> = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  cooling: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200',
  cold: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
  lost: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
  dead: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400',
};

export function SegmentBadge({ segment }: { segment: Segment }) {
  return (
    <Badge variant="secondary" className={cn('font-medium', SEGMENT_CLASS[segment])}>
      {SEGMENT_LABEL_TH[segment]}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge variant="secondary" className={cn('font-medium', STATUS_CLASS[status])}>
      {STATUS_LABEL_TH[status]}
    </Badge>
  );
}
