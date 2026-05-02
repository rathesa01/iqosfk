'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { CalendarClock, Check, Loader2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { setFinanceStartAction, type ActionState } from './actions';

function SaveBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? <Loader2 className="mr-1 size-3.5 animate-spin" /> : <Check className="mr-1 size-3.5" />}
      บันทึก
    </Button>
  );
}

export function CutoffForm({ current, isAdmin }: { current: string; isAdmin: boolean }) {
  const [editing, setEditing] = useState(false);
  const [state, action] = useActionState<ActionState, FormData>(setFinanceStartAction, null);

  if (state?.ok && editing) {
    setEditing(false);
  }

  const formatted = new Date(current).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Bangkok',
  });

  if (!editing) {
    return (
      <div className="bg-muted/40 flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm">
        <CalendarClock className="text-muted-foreground size-4 shrink-0" />
        <span className="text-muted-foreground">เริ่มนับ P&amp;L ตั้งแต่</span>
        <span className="font-medium">{formatted}</span>
        {isAdmin && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => setEditing(true)}
          >
            <Pencil className="mr-1 size-3.5" /> แก้
          </Button>
        )}
      </div>
    );
  }

  return (
    <form
      action={action}
      className="bg-muted/40 flex flex-wrap items-center gap-2 rounded-md border px-3 py-2"
    >
      <CalendarClock className="text-muted-foreground size-4 shrink-0" />
      <span className="text-muted-foreground text-sm">เริ่มนับตั้งแต่</span>
      <Input
        type="date"
        name="startDate"
        defaultValue={current}
        required
        className="h-8 w-40"
      />
      <SaveBtn />
      <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
        ยกเลิก
      </Button>
      {state && !state.ok && <span className="text-destructive text-xs">{state.error}</span>}
    </form>
  );
}
