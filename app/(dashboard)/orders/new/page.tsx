import { eq } from 'drizzle-orm';
import { ArrowLeft } from 'lucide-react';
import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { LinkButton } from '@/components/ui/link-button';
import { OrderForm } from './order-form';

type SearchParams = Promise<{ customerId?: string }>;

export default async function NewOrderPage({ searchParams }: { searchParams: SearchParams }) {
  const { customerId } = await searchParams;
  let label: string | undefined;
  if (customerId) {
    const [c] = await db
      .select({ name: customers.name })
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);
    label = c?.name;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <LinkButton href="/orders" variant="ghost" size="sm">
        <ArrowLeft className="mr-1 size-4" /> กลับ
      </LinkButton>
      <h1 className="text-xl font-bold md:text-2xl">สร้างออเดอร์ใหม่</h1>
      <OrderForm initialCustomerId={customerId} initialCustomerLabel={label} />
    </div>
  );
}
