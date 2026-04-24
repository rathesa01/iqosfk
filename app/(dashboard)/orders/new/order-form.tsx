'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Minus, Plus, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { createOrderAction, type ActionState } from '../actions';

type CustomerOpt = { id: string; name: string; phone: string };
type ProductOpt = {
  id: string;
  sku: string;
  name: string;
  sellPrice: string;
  costPrice: string;
  currentStock: number;
};

type LineItem = {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
};

const DELIVERY_METHODS = ['Kerry', 'Flash', 'J&T', 'Grab', 'พัสดุ', 'รับเอง'];

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? (
        <Loader2 className="mr-2 size-4 animate-spin" />
      ) : (
        <Plus className="mr-2 size-4" />
      )}
      บันทึกออเดอร์
    </Button>
  );
}

type Props = {
  initialCustomerId?: string;
  initialCustomerLabel?: string;
};

export function OrderForm({ initialCustomerId, initialCustomerLabel }: Props) {
  const [state, action] = useActionState<ActionState, FormData>(createOrderAction, null);
  const [customer, setCustomer] = useState<CustomerOpt | null>(
    initialCustomerId
      ? { id: initialCustomerId, name: initialCustomerLabel ?? '', phone: '' }
      : null,
  );
  const [items, setItems] = useState<LineItem[]>([]);
  const [orderDate] = useState(() => new Date().toISOString().slice(0, 10));

  const total = useMemo(
    () => items.reduce((s, it) => s + it.unitPrice * it.quantity, 0),
    [items],
  );
  const totalPieces = useMemo(() => items.reduce((s, it) => s + it.quantity, 0), [items]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="customerId" value={customer?.id ?? ''} />
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">1. ลูกค้า</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerPicker selected={customer} onSelect={setCustomer} />
          {state && !state.ok && state.fieldErrors?.customerId && (
            <p className="text-destructive mt-1 text-sm">{state.fieldErrors.customerId}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">2. สินค้า</CardTitle>
          <span className="text-muted-foreground text-sm">
            {totalPieces} ชิ้น · ฿{total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </span>
        </CardHeader>
        <CardContent className="space-y-3">
          <ProductPicker
            onPick={(p) =>
              setItems((prev) => {
                const idx = prev.findIndex((it) => it.productId === p.id);
                if (idx >= 0) {
                  const copy = [...prev];
                  copy[idx] = { ...copy[idx]!, quantity: copy[idx]!.quantity + 1 };
                  return copy;
                }
                return [
                  ...prev,
                  {
                    productId: p.id,
                    productName: p.name,
                    sku: p.sku,
                    quantity: 1,
                    unitPrice: Number(p.sellPrice),
                    unitCost: Number(p.costPrice),
                  },
                ];
              })
            }
          />

          {items.length === 0 && (
            <p className="text-muted-foreground text-center text-sm">
              ยังไม่มีสินค้า — ค้นหาด้านบน
            </p>
          )}

          <ul className="space-y-2">
            {items.map((it, idx) => (
              <li
                key={it.productId}
                className="bg-muted/30 flex items-center gap-2 rounded-lg border p-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{it.productName}</div>
                  <div className="text-muted-foreground font-mono text-xs">{it.sku}</div>
                </div>
                <QtyStepper
                  value={it.quantity}
                  onChange={(q) =>
                    setItems((p) =>
                      p.map((x, i) => (i === idx ? { ...x, quantity: Math.max(1, q) } : x)),
                    )
                  }
                />
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={it.unitPrice}
                  onChange={(e) =>
                    setItems((p) =>
                      p.map((x, i) =>
                        i === idx ? { ...x, unitPrice: Number(e.target.value) } : x,
                      ),
                    )
                  }
                  className="h-8 w-24 text-right tabular-nums"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive size-8"
                  onClick={() => setItems((p) => p.filter((_, i) => i !== idx))}
                  aria-label="ลบ"
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
          {state && !state.ok && state.fieldErrors?.items && (
            <p className="text-destructive text-sm">{state.fieldErrors.items}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">3. การจัดส่ง</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="orderDate">วันที่ออเดอร์</Label>
            <Input id="orderDate" name="orderDate" type="date" defaultValue={orderDate} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deliveryMethod">วิธีจัดส่ง</Label>
            <select
              id="deliveryMethod"
              name="deliveryMethod"
              className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
              defaultValue=""
            >
              <option value="">— เลือก —</option>
              {DELIVERY_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="deliveryLocation">สถานที่/ที่อยู่</Label>
            <Textarea id="deliveryLocation" name="deliveryLocation" rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="trackingNumber">เลข tracking</Label>
            <Input id="trackingNumber" name="trackingNumber" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">สถานะออเดอร์</Label>
            <select
              id="status"
              name="status"
              className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
              defaultValue="confirmed"
            >
              <option value="confirmed">ยืนยันแล้ว</option>
              <option value="draft">ร่าง</option>
              <option value="cancelled">ยกเลิก</option>
            </select>
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="notes">โน้ต</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>
        </CardContent>
      </Card>

      {state && !state.ok && state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/70 sticky bottom-16 z-10 -mx-3 border-t p-3 backdrop-blur md:bottom-0 md:mx-0 md:rounded-md md:border">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">รวมทั้งสิ้น</span>
          <span className="text-lg font-bold tabular-nums">
            ฿{total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <SubmitBtn />
      </div>
    </form>
  );
}

/* -------------------- Customer picker -------------------- */

function CustomerPicker({
  selected,
  onSelect,
}: {
  selected: CustomerOpt | null;
  onSelect: (c: CustomerOpt | null) => void;
}) {
  const [q, setQ] = useState('');
  const [opts, setOpts] = useState<CustomerOpt[]>([]);
  const [busy, setBusy] = useState(false);
  const ref = useRef<AbortController | null>(null);

  useEffect(() => {
    if (selected || q.trim().length < 1) {
      setOpts([]);
      return;
    }
    ref.current?.abort();
    const ctrl = new AbortController();
    ref.current = ctrl;
    setBusy(true);
    fetch(`/api/customers/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d: CustomerOpt[]) => setOpts(d))
      .catch(() => {})
      .finally(() => setBusy(false));
  }, [q, selected]);

  if (selected) {
    return (
      <div className="bg-muted/40 flex items-center justify-between rounded-md border p-2.5">
        <div>
          <div className="font-medium">{selected.name || '(ไม่มีชื่อ)'}</div>
          {selected.phone && (
            <div className="text-muted-foreground font-mono text-xs">{selected.phone}</div>
          )}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => onSelect(null)}>
          เปลี่ยน
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหาด้วยชื่อหรือเบอร์…"
          className="pl-9"
          autoFocus
        />
      </div>
      {busy && <p className="text-muted-foreground text-xs">กำลังค้นหา…</p>}
      {opts.length > 0 && (
        <ul className="max-h-72 overflow-y-auto rounded-md border">
          {opts.map((o) => (
            <li
              key={o.id}
              className="hover:bg-muted/60 cursor-pointer border-b p-2 text-sm last:border-0"
              onClick={() => {
                onSelect(o);
                setOpts([]);
                setQ('');
              }}
            >
              <div className="font-medium">{o.name}</div>
              <div className="text-muted-foreground font-mono text-xs">{o.phone}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* -------------------- Product picker -------------------- */

function ProductPicker({ onPick }: { onPick: (p: ProductOpt) => void }) {
  const [q, setQ] = useState('');
  const [opts, setOpts] = useState<ProductOpt[]>([]);
  const ref = useRef<AbortController | null>(null);

  useEffect(() => {
    if (q.trim().length < 1) {
      setOpts([]);
      return;
    }
    ref.current?.abort();
    const ctrl = new AbortController();
    ref.current = ctrl;
    fetch(`/api/products/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d: ProductOpt[]) => setOpts(d))
      .catch(() => {});
  }, [q]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหาสินค้าด้วยชื่อหรือ SKU…"
          className="pl-9"
        />
      </div>
      {opts.length > 0 && (
        <ul className="max-h-72 overflow-y-auto rounded-md border">
          {opts.map((o) => (
            <li
              key={o.id}
              className="hover:bg-muted/60 flex cursor-pointer items-center justify-between border-b p-2 text-sm last:border-0"
              onClick={() => {
                onPick(o);
                setOpts([]);
                setQ('');
              }}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{o.name}</div>
                <div className="text-muted-foreground font-mono text-xs">{o.sku}</div>
              </div>
              <div className="text-right">
                <div className="font-medium tabular-nums">
                  ฿{Number(o.sellPrice).toLocaleString('th-TH')}
                </div>
                <Badge variant={o.currentStock > 0 ? 'secondary' : 'outline'} className="text-xs">
                  คงเหลือ {o.currentStock}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* -------------------- Quantity stepper -------------------- */

function QtyStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-8 rounded-r-none"
        onClick={() => onChange(value - 1)}
        aria-label="ลด"
      >
        <Minus className="size-3.5" />
      </Button>
      <Input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-8 w-12 rounded-none border-x-0 text-center tabular-nums"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-8 rounded-l-none"
        onClick={() => onChange(value + 1)}
        aria-label="เพิ่ม"
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  );
}
