'use client';

import { useTransition } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteExpenseAction } from './actions';

export function DeleteExpenseButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="text-destructive size-7"
      disabled={pending}
      onClick={() => {
        if (confirm('ลบรายการนี้?')) start(() => deleteExpenseAction(id));
      }}
      aria-label="ลบ"
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
    </Button>
  );
}
