import { z } from 'zod';

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, 'กรุณากรอกชื่อ').max(100),
  parentId: z.string().uuid().optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const productInputSchema = z.object({
  sku: z.string().trim().min(1, 'กรุณากรอก SKU').max(50),
  name: z.string().trim().min(1, 'กรุณากรอกชื่อสินค้า').max(200),
  categoryId: z.string().uuid().optional().nullable(),
  costPrice: z.coerce.number().min(0).default(0),
  sellPrice: z.coerce.number().min(0).default(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(10),
  isActive: z.boolean().default(true),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;
export type ProductInput = z.infer<typeof productInputSchema>;
