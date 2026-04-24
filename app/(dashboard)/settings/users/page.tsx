import { ArrowLeft } from 'lucide-react';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LinkButton } from '@/components/ui/link-button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { requireAdmin } from '@/lib/utils/auth-admin';
import { CreateUserForm } from './create-user-form';
import { ChangeRoleSelect, DeleteUserButton, ResetPasswordButton } from './row-actions';

export const dynamic = 'force-dynamic';

const ROLE_VARIANT: Record<string, 'secondary' | 'outline'> = {
  admin: 'secondary',
  staff: 'outline',
  viewer: 'outline',
};

export default async function UsersPage() {
  const me = await requireAdmin();

  const profiles = await db.execute<{
    id: string;
    email: string;
    fullName: string | null;
    role: string;
    createdAt: Date;
  }>(sql`
    SELECT id, email, full_name AS "fullName", role::text AS role, created_at AS "createdAt"
      FROM public.profiles
     ORDER BY created_at ASC
  `);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <LinkButton href="/settings" variant="ghost" size="sm">
        <ArrowLeft className="mr-1 size-4" /> กลับ
      </LinkButton>

      <Card>
        <CardHeader>
          <CardTitle>สร้างผู้ใช้ใหม่</CardTitle>
          <CardDescription>
            ตั้งอีเมล + รหัสผ่านให้ตรงนี้เลย ผู้ใช้ login ได้ทันที (ไม่ต้องยืนยันอีเมล)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateUserForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ผู้ใช้ทั้งหมด ({profiles.length})</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>อีเมล</TableHead>
                  <TableHead>ชื่อ</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((p) => {
                  const isMe = p.id === me.userId;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {p.email}
                        {isMe && (
                          <Badge variant="outline" className="ml-2">
                            คุณ
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{p.fullName ?? '—'}</TableCell>
                      <TableCell>
                        {isMe ? (
                          <Badge variant={ROLE_VARIANT[p.role] ?? 'outline'}>{p.role}</Badge>
                        ) : (
                          <ChangeRoleSelect
                            userId={p.id}
                            currentRole={p.role as 'admin' | 'staff' | 'viewer'}
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <ResetPasswordButton userId={p.id} email={p.email} />
                          {!isMe && <DeleteUserButton userId={p.id} email={p.email} />}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
