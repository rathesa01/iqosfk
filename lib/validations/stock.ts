import { z } from 'zod';

export const purchaseItemSchema = z.object({
  productId: z.string().uuid('กรุณาเลือกสินค้า'),
  quantity: z.coerce.number().int().min(1, 'อย่างน้อย 1 ชิ้น'),
  costPerUnit: z.coerce.number().min(0),
});

export const purchaseInputSchema = z.object({
  purchaseDate: z.coerce.date(),
  supplier: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  items: z.array(purchaseItemSchema).min(1, 'กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ'),
});

export const stockAdjustmentSchema = z.object({
  productId: z.string().uuid(),
  delta: z.coerce.number().int().refine((v) => v !== 0, 'เปลี่ยนแปลงต้องไม่ใช่ศูนย์'),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const expenseInputSchema = z.object({
  expenseDate: z.coerce.date(),
  category: z.string().trim().min(1, 'กรุณากรอกหมวด').max(50),
  amount: z.coerce.number().min(0),
  description: z.string().trim().max(2000).optional().nullable(),
});

export type PurchaseInput = z.infer<typeof purchaseInputSchema>;
export type ExpenseInput = z.infer<typeof expenseInputSchema>;
