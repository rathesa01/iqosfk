import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LinkButton } from '@/components/ui/link-button';
import { getCronSettings, getNotifySettings } from '@/lib/settings';
import { NotifyForm } from './notify-form';

export const dynamic = 'force-dynamic';

export default async function NotificationsSettingsPage() {
  const notifyCfg = await getNotifySettings();
  const cronCfg = await getCronSettings();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <LinkButton href="/settings" variant="ghost" size="sm">
        <ArrowLeft className="mr-1 size-4" /> กลับไป Settings
      </LinkButton>

      <Card>
        <CardHeader>
          <CardTitle>การแจ้งเตือน</CardTitle>
          <CardDescription>
            ตั้งค่า LINE Messaging API หรือ Webhook (Discord/Slack/Make/Zapier) สำหรับรับสรุปยอดและแจ้งเตือนอัตโนมัติ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotifyForm
            notifyCfg={notifyCfg}
            cronSecret={cronCfg.secret ?? null}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">วิธีตั้งค่า LINE Messaging API</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>
            ⚠️ <strong>LINE Notify ถูกยกเลิกตั้งแต่ March 2025</strong> — ใช้ Messaging API แทน
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              ไปที่{' '}
              <a
                href="https://developers.line.biz/console/"
                target="_blank"
                className="text-primary underline"
              >
                LINE Developers Console
              </a>{' '}
              → สร้าง <em>Provider</em> + <em>Messaging API channel</em>
            </li>
            <li>
              เพิ่ม bot เป็นเพื่อน หรือเชิญเข้ากลุ่ม → จด <code>userId</code> หรือ{' '}
              <code>groupId</code> (ใช้ webhook log หรือเครื่องมือเช่น line-bot-sdk)
            </li>
            <li>
              จากแท็บ <em>Messaging API</em> → คัดลอก <em>Channel Access Token (long-lived)</em>{' '}
              มาใส่ช่อง LINE Token ด้านบน + ใส่ userId/groupId ในช่อง Send To
            </li>
            <li>กด ▶ "ทดสอบส่ง" เพื่อยืนยันว่า bot ส่งข้อความได้</li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cron Jobs (อัตโนมัติ)</CardTitle>
          <CardDescription>เมื่อ deploy ขึ้น Vercel แล้ว Vercel Cron จะยิง endpoints เหล่านี้อัตโนมัติ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <code className="bg-muted rounded px-1.5 py-0.5">GET /api/cron/daily-summary</code> —
              สรุปยอดวัน (ทุกวัน 21:00 BKK)
            </li>
            <li>
              <code className="bg-muted rounded px-1.5 py-0.5">GET /api/cron/contact-reminders</code>{' '}
              — รายชื่อลูกค้าต้องตามวันนี้ (ทุกเช้า 09:00 BKK)
            </li>
          </ul>
          <p className="text-muted-foreground">
            ใช้ Bearer header <code>Authorization: Bearer &lt;cron_secret&gt;</code> เพื่อยืนยัน
            (Vercel Cron ส่งให้อัตโนมัติเมื่อ env <code>CRON_SECRET</code> ตรงกับ secret นี้)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
