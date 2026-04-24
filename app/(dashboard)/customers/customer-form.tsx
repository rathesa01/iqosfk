'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ActionState } from './actions';
import type { Customer } from '@/lib/db/schema';

function SubmitBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
      {label}
    </Button>
  );
}

type Props = {
  initial?: Customer;
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  submitLabel?: string;
};

export function CustomerForm({ initial, action, submitLabel = 'บันทึก' }: Props) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, null);

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="name">ชื่อลูกค้า *</Label>
        <Input id="name" name="name" defaultValue={initial?.name ?? ''} required maxLength={200} />
        {state && !state.ok && state.fieldErrors?.name && (
          <p className="text-destructive text-sm">{state.fieldErrors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">เบอร์โทร *</Label>
        <Input
          id="phone"
          name="phone"
          defaultValue={initial?.phone ?? ''}
          required
          inputMode="tel"
          placeholder="เช่น 0812345678"
        />
        {state && !state.ok && state.fieldErrors?.phone && (
          <p className="text-destructive text-sm">{state.fieldErrors.phone}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="lineId">LINE ID</Label>
        <Input id="lineId" name="lineId" defaultValue={initial?.lineId ?? ''} maxLength={100} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags (คั่นด้วย comma)</Label>
        <Input
          id="tags"
          name="tags"
          defaultValue={initial?.tags?.join(', ') ?? ''}
          placeholder="VIP, ต้องตาม"
        />
      </div>

      <div className="md:col-span-2 space-y-2">
        <Label htmlFor="address">ที่อยู่</Label>
        <Textarea id="address" name="address" defaultValue={initial?.address ?? ''} rows={2} />
      </div>

      <div className="md:col-span-2 space-y-2">
        <Label htmlFor="notes">โน้ต</Label>
        <Textarea id="notes" name="notes" defaultValue={initial?.notes ?? ''} rows={3} />
      </div>

      {state && !state.ok && state.error && (
        <Alert variant="destructive" className="md:col-span-2">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {state && state.ok && (
        <Alert className="md:col-span-2 border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
          <AlertDescription>บันทึกแล้ว ✅</AlertDescription>
        </Alert>
      )}

      <div className="md:col-span-2 flex gap-2">
        <SubmitBtn label={submitLabel} />
      </div>
    </form>
  );
}
