import { z } from 'zod';
import { normalizePhone } from '@/lib/utils/date';

export const customerInputSchema = z.object({
  name: z.string().trim().min(1, 'กรุณากรอกชื่อ').max(200),
  phone: z
    .string()
    .trim()
    .min(8, 'เบอร์ไม่ถูกต้อง')
    .max(20)
    .transform((v) => normalizePhone(v))
    .refine((v) => /^0\d{8,9}$/.test(v), 'เบอร์ต้องเป็น 9–10 หลัก เริ่มด้วย 0'),
  lineId: z.string().trim().max(100).optional().nullable(),
  address: z.string().trim().max(2000).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(50)).default([]),
});

export type CustomerInput = z.infer<typeof customerInputSchema>;
