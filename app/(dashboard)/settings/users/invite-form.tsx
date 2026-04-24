'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { inviteUserAction, type ActionState } from './actions';

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <Loader2 className="mr-2 size-4 animate-spin" />
      ) : (
        <Mail className="mr-2 size-4" />
      )}
      ส่งอีเมลเชิญ
    </Button>
  );
}

export function InviteForm() {
  const [state, action] = useActionState<ActionState, FormData>(inviteUserAction, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="grid gap-3 md:grid-cols-3">
      <div className="space-y-1.5">
        <Label htmlFor="email">อีเมล</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fullName">ชื่อ</Label>
        <Input id="fullName" name="fullName" />
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
        <Alert className="md:col-span-3 border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      {state && !state.ok && (
        <Alert variant="destructive" className="md:col-span-3">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="md:col-span-3">
        <SubmitBtn />
      </div>
    </form>
  );
}
