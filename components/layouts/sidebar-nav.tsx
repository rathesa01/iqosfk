'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Boxes,
  ClipboardList,
  Home,
  Package,
  Receipt,
  Settings,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV: NavItem[] = [
  { href: '/', label: 'หน้าหลัก', icon: Home },
  { href: '/orders', label: 'ออเดอร์', icon: ClipboardList },
  { href: '/customers', label: 'ลูกค้า', icon: Users },
  { href: '/products', label: 'สินค้า', icon: Package },
  { href: '/stock', label: 'สต็อก', icon: Boxes },
  { href: '/analytics', label: 'วิเคราะห์', icon: BarChart3 },
  { href: '/finance', label: 'การเงิน', icon: Receipt },
  { href: '/settings', label: 'ตั้งค่า', icon: Settings },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-2">
      {NAV.map((item) => {
        const active =
          item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href) ?? false;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const items = NAV.slice(0, 5);

  return (
    <nav className="bg-background/95 supports-[backdrop-filter]:bg-background/70 fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t backdrop-blur md:hidden">
      {items.map((item) => {
        const active =
          item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href) ?? false;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-2 text-xs',
              active ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <Icon className="size-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
