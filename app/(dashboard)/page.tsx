import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Phone, AlertTriangle, Heart } from 'lucide-react';
import { formatBkk, nowBkk } from '@/lib/utils/date';

const PLACEHOLDER_STATS = [
  { label: 'ออเดอร์วันนี้', value: '—', icon: ClipboardList, hint: 'ยังไม่มีข้อมูล' },
  { label: 'ลูกค้าใหม่วันนี้', value: '—', icon: Heart, hint: 'ยังไม่มีข้อมูล' },
  { label: 'ต้องติดต่อวันนี้', value: '—', icon: Phone, hint: 'ยังไม่มีข้อมูล' },
  { label: 'สต็อกใกล้หมด', value: '—', icon: AlertTriangle, hint: 'ยังไม่มีข้อมูล' },
];

export default function HomePage() {
  const today = formatBkk(nowBkk(), 'EEEE d MMMM yyyy');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">สวัสดีค่ะ 👋</h1>
        <p className="text-muted-foreground text-sm">วันนี้ {today}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLACEHOLDER_STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-muted-foreground text-sm font-medium">
                  {stat.label}
                </CardTitle>
                <Icon className="text-muted-foreground size-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-muted-foreground text-xs">{stat.hint}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>🚀 Milestone 1: Foundation พร้อมใช้งานแล้ว</CardTitle>
          <CardDescription>
            ระบบพื้นฐาน, Auth, Database schema เสร็จเรียบร้อย — รอ Milestone 2 (Core CRUD)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="text-muted-foreground grid gap-2 text-sm">
            <li className="flex items-center gap-2">
              <Badge variant="secondary">เสร็จแล้ว</Badge>
              Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui
            </li>
            <li className="flex items-center gap-2">
              <Badge variant="secondary">เสร็จแล้ว</Badge>
              Supabase Auth (email/password) + middleware
            </li>
            <li className="flex items-center gap-2">
              <Badge variant="secondary">เสร็จแล้ว</Badge>
              Drizzle ORM + 13 ตาราง + 7 enums
            </li>
            <li className="flex items-center gap-2">
              <Badge>ถัดไป</Badge>
              CRUD ลูกค้า / ออเดอร์ / สินค้า
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
