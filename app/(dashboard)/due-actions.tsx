'use client';

import { useTransition } from 'react';
import { Check, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { markAsContactedAction, snoozeContactAction } from './actions';

export function ContactedButton({ customerId }: { customerId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() => start(() => markAsContactedAction(customerId, 'line'))}
    >
      {pending ? <Loader2 className="mr-1 size-3.5 animate-spin" /> : <Check className="mr-1 size-3.5" />}
      ติดต่อแล้ว
    </Button>
  );
}

export function SnoozeButton({ customerId }: { customerId: string }) {
  const [pending, start] = useTransition();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button type="button" size="sm" variant="ghost" disabled={pending}>
            {pending ? (
              <Loader2 className="mr-1 size-3.5 animate-spin" />
            ) : (
              <Clock className="mr-1 size-3.5" />
            )}
            เลื่อน
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {[3, 7, 14, 30].map((d) => (
          <DropdownMenuItem
            key={d}
            onClick={() => start(() => snoozeContactAction(customerId, d))}
          >
            อีก {d} วัน
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
