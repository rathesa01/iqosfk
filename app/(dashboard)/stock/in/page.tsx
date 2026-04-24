import { ArrowLeft } from 'lucide-react';
import { LinkButton } from '@/components/ui/link-button';
import { PurchaseForm } from './purchase-form';

export default function NewPurchasePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <LinkButton href="/stock" variant="ghost" size="sm">
        <ArrowLeft className="mr-1 size-4" /> กลับ
      </LinkButton>
      <h1 className="text-xl font-bold md:text-2xl">รับสินค้าเข้าสต็อก</h1>
      <PurchaseForm />
    </div>
  );
}
