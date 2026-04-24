import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgSchema,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

/* -------------------------------------------------------------------------- */
/*  Enums                                                                      */
/* -------------------------------------------------------------------------- */

export const userRole = pgEnum('user_role', ['admin', 'staff', 'viewer']);

export const customerSegment = pgEnum('customer_segment', [
  'platinum',
  'gold',
  'regular',
  'returning',
  'onetime',
]);

export const customerStatus = pgEnum('customer_status', [
  'active',
  'cooling',
  'cold',
  'lost',
  'dead',
]);

export const orderStatus = pgEnum('order_status', ['draft', 'confirmed', 'cancelled']);

export const deliveryStatus = pgEnum('delivery_status', [
  'pending',
  'shipped',
  'delivered',
  'returned',
]);

export const stockMovementType = pgEnum('stock_movement_type', ['in', 'out', 'adjustment']);

export const contactChannel = pgEnum('contact_channel', ['line', 'phone', 'email', 'other']);

/* -------------------------------------------------------------------------- */
/*  Reference: Supabase auth schema                                            */
/* -------------------------------------------------------------------------- */

const authSchema = pgSchema('auth');
export const authUsers = authSchema.table('users', {
  id: uuid('id').primaryKey(),
});

/* -------------------------------------------------------------------------- */
/*  Profiles (1-to-1 with auth.users)                                          */
/* -------------------------------------------------------------------------- */

export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id')
      .primaryKey()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 320 }).notNull(),
    fullName: varchar('full_name', { length: 200 }),
    role: userRole('role').notNull().default('staff'),
    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('profiles_email_idx').on(t.email)],
);

/* -------------------------------------------------------------------------- */
/*  Customers                                                                  */
/* -------------------------------------------------------------------------- */

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 200 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),
    lineId: varchar('line_id', { length: 100 }),
    address: text('address'),
    notes: text('notes'),
    tags: text('tags').array().notNull().default(sql`'{}'::text[]`),

    // Computed analytics (refreshed by trigger / scheduled job)
    totalOrders: integer('total_orders').notNull().default(0),
    totalPieces: integer('total_pieces').notNull().default(0),
    firstOrderDate: timestamp('first_order_date', { withTimezone: true }),
    lastOrderDate: timestamp('last_order_date', { withTimezone: true }),
    avgFreqDays: numeric('avg_freq_days', { precision: 6, scale: 1 }),
    nextExpectedDate: timestamp('next_expected_date', { withTimezone: true }),
    segment: customerSegment('segment').notNull().default('onetime'),
    status: customerStatus('status').notNull().default('active'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),
  },
  (t) => [
    uniqueIndex('customers_phone_idx').on(t.phone),
    index('customers_segment_idx').on(t.segment),
    index('customers_status_idx').on(t.status),
    index('customers_last_order_idx').on(t.lastOrderDate),
  ],
);

/* -------------------------------------------------------------------------- */
/*  Categories & Products                                                      */
/* -------------------------------------------------------------------------- */

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    parentId: uuid('parent_id'),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('categories_parent_idx').on(t.parentId)],
);

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sku: varchar('sku', { length: 50 }).notNull(),
    name: varchar('name', { length: 200 }).notNull(),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    costPrice: numeric('cost_price', { precision: 12, scale: 2 }).notNull().default('0'),
    sellPrice: numeric('sell_price', { precision: 12, scale: 2 }).notNull().default('0'),
    currentStock: integer('current_stock').notNull().default(0),
    lowStockThreshold: integer('low_stock_threshold').notNull().default(10),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('products_sku_idx').on(t.sku),
    index('products_category_idx').on(t.categoryId),
  ],
);

/* -------------------------------------------------------------------------- */
/*  Orders                                                                     */
/* -------------------------------------------------------------------------- */

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderNumber: varchar('order_number', { length: 30 }).notNull(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),
    orderDate: timestamp('order_date', { withTimezone: true }).notNull().defaultNow(),
    deliveryMethod: varchar('delivery_method', { length: 50 }),
    deliveryLocation: text('delivery_location'),
    trackingNumber: varchar('tracking_number', { length: 100 }),
    deliveryStatus: deliveryStatus('delivery_status').notNull().default('pending'),
    notes: text('notes'),
    totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull().default('0'),
    totalPieces: integer('total_pieces').notNull().default(0),
    status: orderStatus('status').notNull().default('confirmed'),
    createdBy: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('orders_number_idx').on(t.orderNumber),
    index('orders_customer_idx').on(t.customerId),
    index('orders_date_idx').on(t.orderDate),
    index('orders_status_idx').on(t.status),
  ],
);

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    quantity: integer('quantity').notNull(),
    unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
    unitCost: numeric('unit_cost', { precision: 12, scale: 2 }).notNull().default('0'),
    subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [
    index('order_items_order_idx').on(t.orderId),
    index('order_items_product_idx').on(t.productId),
  ],
);

/* -------------------------------------------------------------------------- */
/*  Stock & purchases                                                          */
/* -------------------------------------------------------------------------- */

export const stockMovements = pgTable(
  'stock_movements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    movementType: stockMovementType('movement_type').notNull(),
    quantity: integer('quantity').notNull(),
    referenceType: varchar('reference_type', { length: 30 }),
    referenceId: uuid('reference_id'),
    costPerUnit: numeric('cost_per_unit', { precision: 12, scale: 2 }),
    notes: text('notes'),
    createdBy: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('stock_movements_product_idx').on(t.productId)],
);

export const purchases = pgTable('purchases', {
  id: uuid('id').primaryKey().defaultRandom(),
  purchaseDate: timestamp('purchase_date', { withTimezone: true }).notNull().defaultNow(),
  supplier: varchar('supplier', { length: 200 }),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const purchaseItems = pgTable(
  'purchase_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    purchaseId: uuid('purchase_id')
      .notNull()
      .references(() => purchases.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    quantity: integer('quantity').notNull(),
    costPerUnit: numeric('cost_per_unit', { precision: 12, scale: 2 }).notNull(),
    subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  },
  (t) => [index('purchase_items_purchase_idx').on(t.purchaseId)],
);

export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  expenseDate: timestamp('expense_date', { withTimezone: true }).notNull().defaultNow(),
  category: varchar('category', { length: 50 }).notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  description: text('description'),
  createdBy: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*  Customer contacts & activity logs                                          */
/* -------------------------------------------------------------------------- */

export const customerContacts = pgTable(
  'customer_contacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    contactDate: timestamp('contact_date', { withTimezone: true }).notNull().defaultNow(),
    channel: contactChannel('channel').notNull().default('line'),
    notes: text('notes'),
    createdBy: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),
  },
  (t) => [index('customer_contacts_customer_idx').on(t.customerId)],
);

export const activityLogs = pgTable(
  'activity_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => profiles.id, { onDelete: 'set null' }),
    action: varchar('action', { length: 50 }).notNull(),
    entityType: varchar('entity_type', { length: 50 }),
    entityId: uuid('entity_id'),
    details: jsonb('details'),
    ipAddress: varchar('ip_address', { length: 45 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('activity_logs_user_idx').on(t.userId),
    index('activity_logs_entity_idx').on(t.entityType, t.entityId),
  ],
);

/* -------------------------------------------------------------------------- */
/*  Settings (key-value)                                                       */
/* -------------------------------------------------------------------------- */

export const settings = pgTable(
  'settings',
  {
    key: varchar('key', { length: 100 }).notNull(),
    value: jsonb('value').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.key] })],
);

/* -------------------------------------------------------------------------- */
/*  Type helpers                                                               */
/* -------------------------------------------------------------------------- */

export type Profile = typeof profiles.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
