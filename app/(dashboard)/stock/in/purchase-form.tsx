'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Plus, Search, SearchX, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createPurchaseAction, type ActionState } from '../actions';

type ProductOpt = {
  id: string;
  sku: string;
  name: string;
  costPrice: string;
  currentStock: number;
};

type LineItem = {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  costPerUnit: number;
};

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? (
        <Loader2 className="mr-2 size-4 animate-spin" />
      ) : (
        <Plus className="mr-2 size-4" />
      )}
      บันทึกการรับเข้า
    </Button>
  );
}

export function PurchaseForm() {
  const [state, action] = useActionState<ActionState, FormData>(createPurchaseAction, null);
  const [items, setItems] = useState<LineItem[]>([]);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const total = useMemo(
    () => items.reduce((s, it) => s + it.quantity * it.costPerUnit, 0),
    [items],
  );
  const totalPieces = useMemo(() => items.reduce((s, it) => s + it.quantity, 0), [items]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">ข้อมูลการรับเข้า</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="purchaseDate">วันที่รับ</Label>
            <Input
              id="purchaseDate"
              name="purchaseDate"
              type="date"
              defaultValue={today}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="supplier">ผู้ขาย/Supplier</Label>
            <Input id="supplier" name="supplier" placeholder="เช่น ตัวแทน A" />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="notes">โน้ต</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">สินค้าที่รับ</CardTitle>
          <span className="text-muted-foreground text-sm">
            {totalPieces} ชิ้น · ฿{total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </span>
        </CardHeader>
        <CardContent className="space-y-3">
          <ProductPicker
            onPick={(p) =>
              setItems((prev) => {
                const idx = prev.findIndex((x) => x.productId === p.id);
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
                    costPerUnit: Number(p.costPrice),
                  },
                ];
              })
            }
          />

          <ul className="space-y-2">
            {items.map((it, idx) => (
              <li
                key={it.productId}
                className="bg-muted/30 grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 rounded-lg border p-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{it.productName}</div>
                  <div className="text-muted-foreground font-mono text-xs">{it.sku}</div>
                </div>
                <Input
                  type="number"
                  min={1}
                  value={it.quantity}
                  onChange={(e) =>
                    setItems((p) =>
                      p.map((x, i) =>
                        i === idx
                          ? { ...x, quantity: Math.max(1, Number(e.target.value)) }
                          : x,
                      ),
                    )
                  }
                  className="h-8 w-20 text-right tabular-nums"
                />
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={it.costPerUnit}
                  onChange={(e) =>
                    setItems((p) =>
                      p.map((x, i) =>
                        i === idx ? { ...x, costPerUnit: Number(e.target.value) } : x,
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

      {state && !state.ok && state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/70 sticky bottom-16 z-10 -mx-3 border-t p-3 backdrop-blur md:bottom-0 md:mx-0 md:rounded-md md:border">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">มูลค่ารับเข้ารวม</span>
          <span className="text-lg font-bold tabular-nums">
            ฿{total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <SubmitBtn />
      </div>
    </form>
  );
}

function ProductPicker({ onPick }: { onPick: (p: ProductOpt) => void }) {
  const [q, setQ] = useState('');
  const [opts, setOpts] = useState<ProductOpt[]>([]);
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);
  const ref = useRef<AbortController | null>(null);

  useEffect(() => {
    if (q.trim().length < 1) {
      setOpts([]);
      setBusy(false);
      return;
    }
    ref.current?.abort();
    const ctrl = new AbortController();
    ref.current = ctrl;
    setBusy(true);
    setTouched(true);
    const handle = setTimeout(() => {
      fetch(`/api/products/search-lite?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then(setOpts)
        .catch(() => {})
        .finally(() => setBusy(false));
    }, 200);
    return () => {
      clearTimeout(handle);
      ctrl.abort();
    };
  }, [q]);

  const showEmpty = touched && !busy && q.trim().length > 0 && opts.length === 0;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหาสินค้า…"
          className="pl-9 pr-9"
        />
        {busy && (
          <Loader2 className="text-muted-foreground absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin" />
        )}
      </div>
      {busy && (
        <div className="text-muted-foreground flex items-center gap-2 px-1 text-sm">
          <Loader2 className="size-3.5 animate-spin" />
          <span>กำลังค้นหา…</span>
        </div>
      )}
      {showEmpty && (
        <div className="text-muted-foreground flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm">
          <SearchX className="size-4" />
          <span>ไม่พบสินค้าที่ตรงกับ &ldquo;{q}&rdquo;</span>
        </div>
      )}
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
                setTouched(false);
              }}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{o.name}</div>
                <div className="text-muted-foreground font-mono text-xs">
                  {o.sku} · คงเหลือ {o.currentStock}
                </div>
              </div>
              <div className="text-right text-xs tabular-nums">
                ทุน ฿{Number(o.costPrice).toLocaleString('th-TH')}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
