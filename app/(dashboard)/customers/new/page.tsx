import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LinkButton } from '@/components/ui/link-button';
import { CustomerForm } from '../customer-form';
import { createCustomerAction } from '../actions';

export default function NewCustomerPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <LinkButton href="/customers" variant="ghost" size="sm">
        <ArrowLeft className="mr-1 size-4" /> กลับไปหน้าลูกค้า
      </LinkButton>

      <Card>
        <CardHeader>
          <CardTitle>เพิ่มลูกค้าใหม่</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerForm action={createCustomerAction} submitLabel="สร้างลูกค้า" />
        </CardContent>
      </Card>
    </div>
  );
}
