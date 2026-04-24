import Link from 'next/link';
import {
  Bell,
  Database,
  Download,
  FileText,
  ShieldCheck,
  Users as UsersIcon,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ITEMS = [
  {
    href: '/settings/notifications',
    icon: Bell,
    title: 'การแจ้งเตือน',
    desc: 'LINE, Webhook, Cron schedules',
  },
  {
    href: '/settings/users',
    icon: UsersIcon,
    title: 'ผู้ใช้งาน',
    desc: 'เชิญ, จัดการ role, ลบ user (admin เท่านั้น)',
  },
  {
    href: '/settings/activity',
    icon: ShieldCheck,
    title: 'Activity Logs',
    desc: 'ดูว่าใครทำอะไรเมื่อไหร่',
  },
  {
    href: '/settings/exports',
    icon: Download,
    title: 'Export ข้อมูล',
    desc: 'CSV: orders, customers, P&L',
  },
];

export default function SettingsIndexPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ตั้งค่า</h1>
        <p className="text-muted-foreground text-sm">
          การตั้งค่าระบบ — เปิดเฉพาะ admin บางหัวข้อ
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="hover:bg-muted/30 h-full transition-colors">
                <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                  <div className="bg-primary/10 text-primary rounded-md p-2">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <CardDescription>{item.desc}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="size-4" /> ระบบ
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-1 text-sm">
          <div>Timezone: <code>Asia/Bangkok</code></div>
          <div>
            Supabase project:{' '}
            <code>{process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '')}</code>
          </div>
          <div>
            App URL:{' '}
            <code>{process.env.NEXT_PUBLIC_APP_URL ?? '-'}</code>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="size-4" /> เอกสาร
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          <p>
            อ่าน <code>README.md</code> หรือ{' '}
            <a
              href="https://github.com/rathesa01/iqosfk"
              target="_blank"
              className="text-primary underline"
            >
              GitHub repo
            </a>{' '}
            สำหรับคู่มือการ deploy + migration
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
