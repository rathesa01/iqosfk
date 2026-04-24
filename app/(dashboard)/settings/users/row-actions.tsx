'use client';

import { useState, useTransition } from 'react';
import { KeyRound, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { changeRoleAction, deleteUserAction, resetPasswordAction } from './actions';

export function ChangeRoleSelect({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: 'admin' | 'staff' | 'viewer';
}) {
  const [pending, start] = useTransition();
  return (
    <select
      defaultValue={currentRole}
      disabled={pending}
      onChange={(e) =>
        start(() => changeRoleAction(userId, e.target.value as 'admin' | 'staff' | 'viewer'))
      }
      className="border-input bg-background h-7 rounded-md border px-2 text-xs"
    >
      <option value="admin">admin</option>
      <option value="staff">staff</option>
      <option value="viewer">viewer</option>
    </select>
  );
}

export function DeleteUserButton({ userId, email }: { userId: string; email: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="text-destructive size-7"
      disabled={pending}
      onClick={() => {
        if (confirm(`ลบผู้ใช้ ${email}?`)) start(() => deleteUserAction(userId));
      }}
      aria-label="ลบผู้ใช้"
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
    </Button>
  );
}

export function ResetPasswordButton({ userId, email }: { userId: string; email: string }) {
  const [open, setOpen] = useState(false);
  const [pwd, setPwd] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (pwd.length < 6) {
      setError('รหัสผ่านต้องอย่างน้อย 6 ตัว');
      return;
    }
    start(async () => {
      try {
        await resetPasswordAction(userId, pwd);
        setOpen(false);
        setPwd('');
        alert(`✅ รีเซ็ตรหัสผ่านของ ${email} สำเร็จ`);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'ผิดพลาด');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="รีเซ็ตรหัสผ่าน"
            title="รีเซ็ตรหัสผ่าน"
          >
            <KeyRound className="size-3.5" />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>รีเซ็ตรหัสผ่าน</DialogTitle>
          <DialogDescription>{email}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="newPwd">รหัสผ่านใหม่ (≥ 6 ตัว)</Label>
            <Input
              id="newPwd"
              type="text"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              autoComplete="new-password"
              autoFocus
              minLength={6}
              className="font-mono"
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
              ตั้งรหัสใหม่
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
