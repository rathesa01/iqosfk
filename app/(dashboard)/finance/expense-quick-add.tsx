'use client';

import { useActionState, useEffect, useMemo, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createExpenseAction, type ActionState } from './actions';

const COMMON_CATS = ['ค่าส่ง', 'แพ็ค', 'โฆษณา', 'ค่ารับเงิน', 'อื่นๆ'];

function AddBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      <Plus className="mr-1 size-3.5" /> เพิ่ม
    </Button>
  );
}

export function ExpenseQuickAdd() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [state, action] = useActionState<ActionState, FormData>(createExpenseAction, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-2 rounded-md border p-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="expenseDate" className="text-xs">
            วันที่
          </Label>
          <Input id="expenseDate" name="expenseDate" type="date" defaultValue={today} required className="h-8" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="amount" className="text-xs">
            ยอด (บาท)
          </Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min={0}
            required
            className="h-8 text-right tabular-nums"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="category" className="text-xs">
          หมวด
        </Label>
        <Input
          id="category"
          name="category"
          list="expense-cats"
          required
          maxLength={50}
          className="h-8"
        />
        <datalist id="expense-cats">
          {COMMON_CATS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>
      <div className="space-y-1">
        <Label htmlFor="description" className="text-xs">
          คำอธิบาย
        </Label>
        <Input id="description" name="description" maxLength={200} className="h-8" />
      </div>
      {state && !state.ok && state.error && (
        <p className="text-destructive text-xs">{state.error}</p>
      )}
      <div className="flex justify-end">
        <AddBtn />
      </div>
    </form>
  );
}
