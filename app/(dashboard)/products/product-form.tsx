'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ActionState } from './actions';
import type { Product } from '@/lib/db/schema';

function SubmitBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
      {label}
    </Button>
  );
}

type Cat = { id: string; name: string };

type Props = {
  initial?: Product;
  categories: Cat[];
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  submitLabel?: string;
};

export function ProductForm({ initial, categories, action, submitLabel = 'บันทึก' }: Props) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, null);

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="sku">SKU *</Label>
        <Input id="sku" name="sku" defaultValue={initial?.sku ?? ''} required maxLength={50} />
        {state && !state.ok && state.fieldErrors?.sku && (
          <p className="text-destructive text-sm">{state.fieldErrors.sku}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">ชื่อสินค้า *</Label>
        <Input id="name" name="name" defaultValue={initial?.name ?? ''} required maxLength={200} />
        {state && !state.ok && state.fieldErrors?.name && (
          <p className="text-destructive text-sm">{state.fieldErrors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoryId">หมวดหมู่</Label>
        <select
          id="categoryId"
          name="categoryId"
          defaultValue={initial?.categoryId ?? ''}
          className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
        >
          <option value="">— ไม่ระบุ —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="lowStockThreshold">จุดเตือนสต็อกต่ำ</Label>
        <Input
          id="lowStockThreshold"
          name="lowStockThreshold"
          type="number"
          min={0}
          defaultValue={initial?.lowStockThreshold ?? 10}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="costPrice">ราคาทุน (บาท)</Label>
        <Input
          id="costPrice"
          name="costPrice"
          type="number"
          step="0.01"
          min={0}
          defaultValue={initial?.costPrice ?? '0'}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sellPrice">ราคาขาย (บาท)</Label>
        <Input
          id="sellPrice"
          name="sellPrice"
          type="number"
          step="0.01"
          min={0}
          defaultValue={initial?.sellPrice ?? '0'}
        />
      </div>

      <div className="flex items-center gap-3">
        <Switch
          id="isActive"
          name="isActive"
          defaultChecked={initial?.isActive ?? true}
          value="true"
        />
        <Label htmlFor="isActive">เปิดขาย</Label>
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

      <div className="md:col-span-2">
        <SubmitBtn label={submitLabel} />
      </div>
    </form>
  );
}
