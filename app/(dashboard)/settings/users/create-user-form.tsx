'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Eye, EyeOff, Loader2, RefreshCw, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createUserAction, type ActionState } from './actions';

function generatePassword(): string {
  // 12 chars, uppercase + lowercase + digits + a couple of symbols.
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const sym = '!@#$%';
  const all = upper + lower + digits + sym;
  let out =
    upper[Math.floor(Math.random() * upper.length)]! +
    lower[Math.floor(Math.random() * lower.length)]! +
    digits[Math.floor(Math.random() * digits.length)]! +
    sym[Math.floor(Math.random() * sym.length)]!;
  for (let i = 0; i < 8; i++) out += all[Math.floor(Math.random() * all.length)]!;
  return out
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <Loader2 className="mr-2 size-4 animate-spin" />
      ) : (
        <UserPlus className="mr-2 size-4" />
      )}
      สร้างผู้ใช้
    </Button>
  );
}

export function CreateUserForm() {
  const [state, action] = useActionState<ActionState, FormData>(createUserAction, null);
  const ref = useRef<HTMLFormElement>(null);
  const [pwd, setPwd] = useState('');
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (state?.ok) {
      ref.current?.reset();
      setPwd('');
      setShow(false);
    }
  }, [state]);

  return (
    <form ref={ref} action={action} className="grid gap-3 md:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="email">อีเมล *</Label>
        <Input id="email" name="email" type="email" required autoComplete="off" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="fullName">ชื่อ</Label>
        <Input id="fullName" name="fullName" autoComplete="off" />
      </div>

      <div className="space-y-1.5 md:col-span-1">
        <Label htmlFor="password">รหัสผ่าน * (≥ 6 ตัว)</Label>
        <div className="flex gap-1.5">
          <div className="relative flex-1">
            <Input
              id="password"
              name="password"
              type={show ? 'text' : 'password'}
              minLength={6}
              required
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              autoComplete="new-password"
              className="pr-9 font-mono"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="text-muted-foreground hover:text-foreground absolute right-2 top-1/2 -translate-y-1/2"
              aria-label={show ? 'ซ่อนรหัส' : 'แสดงรหัส'}
              tabIndex={-1}
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => {
              setPwd(generatePassword());
              setShow(true);
            }}
            aria-label="สุ่มรหัส"
            title="สุ่มรหัสผ่าน"
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          name="role"
          defaultValue="staff"
          className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
        >
          <option value="staff">staff (กรอก/แก้ออเดอร์)</option>
          <option value="viewer">viewer (อ่านอย่างเดียว)</option>
          <option value="admin">admin (ทุกอย่าง)</option>
        </select>
      </div>

      {state && state.ok && state.message && (
        <Alert className="md:col-span-2 border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
          <AlertDescription>
            ✅ {state.message}
            <div className="mt-1 text-xs opacity-80">
              อย่าลืมแจ้งรหัสผ่านให้ผู้ใช้ — ระบบไม่ส่งอีเมลให้
            </div>
          </AlertDescription>
        </Alert>
      )}
      {state && !state.ok && (
        <Alert variant="destructive" className="md:col-span-2">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="md:col-span-2 flex items-center justify-between">
        <p className="text-muted-foreground text-xs">
          ผู้ใช้จะ login ด้วยอีเมล + รหัสผ่านนี้ทันที (ไม่ต้องยืนยันอีเมล)
        </p>
        <SubmitBtn />
      </div>
    </form>
  );
}
