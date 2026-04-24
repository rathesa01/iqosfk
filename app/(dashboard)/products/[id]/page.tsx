import { notFound } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { ArrowLeft } from 'lucide-react';
import { db } from '@/lib/db';
import { categories, products } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { LinkButton } from '@/components/ui/link-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductForm } from '../product-form';
import { updateProductAction, deleteProductAction } from '../actions';

type Props = { params: Promise<{ id: string }> };

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!product) notFound();

  const cats = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .orderBy(asc(categories.name));

  const updateBound = updateProductAction.bind(null, id);
  const deleteBound = deleteProductAction.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <LinkButton href="/products" variant="ghost" size="sm">
          <ArrowLeft className="mr-1 size-4" /> กลับ
        </LinkButton>
        <form action={deleteBound}>
          <Button type="submit" variant="outline" className="text-destructive">
            ลบสินค้า
          </Button>
        </form>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{product.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            initial={product}
            categories={cats}
            action={updateBound}
            submitLabel="บันทึกการแก้ไข"
          />
        </CardContent>
      </Card>
    </div>
  );
}
