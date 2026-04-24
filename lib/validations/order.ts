import { z } from 'zod';

export const orderItemInputSchema = z.object({
  productId: z.string().uuid('กรุณาเลือกสินค้า'),
  quantity: z.coerce.number().int().min(1, 'อย่างน้อย 1 ชิ้น'),
  unitPrice: z.coerce.number().min(0),
  unitCost: z.coerce.number().min(0).default(0),
});

export const orderInputSchema = z.object({
  customerId: z.string().uuid('กรุณาเลือกลูกค้า'),
  orderDate: z.coerce.date(),
  deliveryMethod: z.string().trim().max(50).optional().nullable(),
  deliveryLocation: z.string().trim().max(2000).optional().nullable(),
  trackingNumber: z.string().trim().max(100).optional().nullable(),
  deliveryStatus: z.enum(['pending', 'shipped', 'delivered', 'returned']).default('pending'),
  status: z.enum(['draft', 'confirmed', 'cancelled']).default('confirmed'),
  notes: z.string().trim().max(2000).optional().nullable(),
  items: z.array(orderItemInputSchema).min(1, 'กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ'),
});

export type OrderInput = z.infer<typeof orderInputSchema>;
export type OrderItemInput = z.infer<typeof orderItemInputSchema>;
