'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createCategoryAction, type ActionState } from './actions';

function AddBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      <Plus className="mr-1 size-3.5" />
      เพิ่ม
    </Button>
  );
}

export function CategoryQuickAdd() {
  const [state, action] = useActionState<ActionState, FormData>(createCategoryAction, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="flex gap-2">
      <Input name="name" placeholder="ชื่อหมวดหมู่ใหม่" required maxLength={100} />
      <AddBtn />
    </form>
  );
}
