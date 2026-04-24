'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { adjustStockAction, type ActionState } from './actions';

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
      บันทึก
    </Button>
  );
}

export function AdjustStockButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<ActionState, FormData>(adjustStockAction, null);

  if (state?.ok && open) {
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm" aria-label="ปรับสต็อก">
            <Pencil className="size-3.5" />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ปรับสต็อก: {productName}</DialogTitle>
          <DialogDescription>
            ใส่ตัวเลขบวก = เพิ่ม, ลบ = ลด (เช่น -3 หมายถึงลด 3 ชิ้น)
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="productId" value={productId} />
          <div className="space-y-2">
            <Label htmlFor="delta">เปลี่ยนแปลง</Label>
            <Input
              id="delta"
              name="delta"
              type="number"
              step={1}
              required
              placeholder="เช่น 5 หรือ -2"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">เหตุผล (เลือกระบุ)</Label>
            <Textarea id="notes" name="notes" rows={2} placeholder="เช่น ตรวจนับสต็อก" />
          </div>
          {state && !state.ok && state.error && (
            <p className="text-destructive text-sm">{state.error}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              ยกเลิก
            </Button>
            <SubmitBtn />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
