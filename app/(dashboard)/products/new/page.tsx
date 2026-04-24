import { asc } from 'drizzle-orm';
import { ArrowLeft } from 'lucide-react';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { LinkButton } from '@/components/ui/link-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductForm } from '../product-form';
import { createProductAction } from '../actions';

export default async function NewProductPage() {
  const cats = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .orderBy(asc(categories.name));

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <LinkButton href="/products" variant="ghost" size="sm">
        <ArrowLeft className="mr-1 size-4" /> กลับ
      </LinkButton>
      <Card>
        <CardHeader>
          <CardTitle>เพิ่มสินค้าใหม่</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm action={createProductAction} categories={cats} submitLabel="สร้างสินค้า" />
        </CardContent>
      </Card>
    </div>
  );
}
