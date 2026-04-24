'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, RefreshCw, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  saveNotifySettingsAction,
  testNotifyAction,
  rotateCronSecretAction,
  type ActionState,
} from './actions';
import type { NotifySettings } from '@/lib/settings';

function SaveBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
      บันทึก
    </Button>
  );
}

function TestBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={pending}>
      {pending ? (
        <Loader2 className="mr-2 size-4 animate-spin" />
      ) : (
        <Send className="mr-2 size-4" />
      )}
      ทดสอบส่ง
    </Button>
  );
}

function RotateBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" disabled={pending}>
      {pending ? (
        <Loader2 className="mr-2 size-4 animate-spin" />
      ) : (
        <RefreshCw className="mr-2 size-4" />
      )}
      สร้าง secret ใหม่
    </Button>
  );
}

type Props = {
  notifyCfg: NotifySettings;
  cronSecret: string | null;
};

export function NotifyForm({ notifyCfg, cronSecret }: Props) {
  const [saveState, saveAction] = useActionState<ActionState, FormData>(
    saveNotifySettingsAction,
    null,
  );
  const [testState, testAction] = useActionState<ActionState, FormData>(testNotifyAction, null);
  const [rotateState, rotateAction] = useActionState<ActionState, FormData>(
    rotateCronSecretAction,
    null,
  );

  return (
    <div className="space-y-6">
      <form action={saveAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="lineToken">LINE Channel Access Token</Label>
          <Input
            id="lineToken"
            name="lineToken"
            type="password"
            defaultValue={notifyCfg.lineToken ?? ''}
            placeholder="long-lived token จาก LINE Developers Console"
            autoComplete="off"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lineTo">LINE Send To (userId หรือ groupId)</Label>
          <Input
            id="lineTo"
            name="lineTo"
            defaultValue={notifyCfg.lineTo ?? ''}
            placeholder="U... หรือ C..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="webhookUrl">Webhook URL (Discord/Slack/Make/Zapier)</Label>
          <Input
            id="webhookUrl"
            name="webhookUrl"
            defaultValue={notifyCfg.webhookUrl ?? ''}
            placeholder="https://..."
            autoComplete="off"
          />
          <p className="text-muted-foreground text-xs">
            POST JSON: <code>{`{ "content": "<text>", "text": "<text>" }`}</code> — เข้ากันได้กับ Discord webhook
          </p>
        </div>

        {saveState && saveState.ok && saveState.message && (
          <Alert className="border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
            <AlertDescription>{saveState.message}</AlertDescription>
          </Alert>
        )}
        {saveState && !saveState.ok && (
          <Alert variant="destructive">
            <AlertDescription>{saveState.error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end">
          <SaveBtn />
        </div>
      </form>

      <div className="space-y-3 rounded-md border p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">ทดสอบ</h3>
          <form action={testAction}>
            <TestBtn />
          </form>
        </div>
        {testState && testState.ok && testState.message && (
          <p className="text-sm text-emerald-600">{testState.message}</p>
        )}
        {testState && !testState.ok && (
          <p className="text-destructive text-sm">{testState.error}</p>
        )}
      </div>

      <div className="space-y-3 rounded-md border p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Cron Secret</h3>
          <form action={rotateAction}>
            <RotateBtn />
          </form>
        </div>
        {cronSecret ? (
          <div className="space-y-1">
            <Label className="text-xs">เก็บ secret นี้ใน Vercel env <code>CRON_SECRET</code></Label>
            <code className="bg-muted block break-all rounded px-2 py-1.5 font-mono text-xs">
              {cronSecret}
            </code>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">ยังไม่มี secret — กดปุ่มเพื่อสร้าง</p>
        )}
        {rotateState && rotateState.ok && rotateState.message && (
          <p className="text-sm text-emerald-600">{rotateState.message}</p>
        )}
      </div>
    </div>
  );
}
