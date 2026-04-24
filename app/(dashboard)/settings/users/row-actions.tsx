'use client';

import { useTransition } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { changeRoleAction, deleteUserAction } from './actions';

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
