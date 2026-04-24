'use client';

import { Menu, Moon, Sun, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SidebarNav } from './sidebar-nav';
import { logoutAction } from '@/app/(auth)/login/actions';

type Props = {
  email: string;
  fullName?: string | null;
  role?: string | null;
};

export function Topbar({ email, fullName, role }: Props) {
  const { setTheme, theme } = useTheme();
  const [open, setOpen] = useState(false);
  const initials = (fullName ?? email).slice(0, 2).toUpperCase();

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-20 flex h-14 items-center gap-2 border-b px-3 backdrop-blur md:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="เปิดเมนู">
              <Menu className="size-5" />
            </Button>
          }
        />
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="border-b px-4 py-3 text-base">IQOS CRM</SheetTitle>
          <SidebarNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="font-semibold md:hidden">IQOS CRM</div>

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="สลับธีม"
        >
          <Sun className="size-4 dark:hidden" />
          <Moon className="hidden size-4 dark:block" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="h-9 gap-2 px-2">
                <Avatar className="size-7">
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden text-sm md:inline">{fullName ?? email}</span>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="text-sm font-medium">{fullName ?? 'ผู้ใช้งาน'}</div>
              <div className="text-muted-foreground text-xs">{email}</div>
              {role && <div className="text-muted-foreground mt-1 text-xs uppercase">{role}</div>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <form action={logoutAction}>
              <DropdownMenuItem
                render={
                  <button type="submit" className="w-full cursor-pointer">
                    <LogOut className="mr-2 size-4" />
                    ออกจากระบบ
                  </button>
                }
              />
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
