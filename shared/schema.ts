import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  decimal,
  integer,
  pgEnum
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User role enum
export const userRoleEnum = pgEnum("user_role", ["patient", "pharmacist", "admin"]);

// Prescription status enum
export const prescriptionStatusEnum = pgEnum("prescription_status", [
  "pending_review",
  "approved", 
  "in_progress",
  "ready_for_pickup",
  "dispensed",
  "cancelled"
]);

// Order status enum
export const orderStatusEnum = pgEnum("order_status", [
  "pending_payment",
  "paid",
  "processing", 
  "ready",
  "completed",
  "cancelled"
]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default("patient"),
  phone: varchar("phone"),
  dateOfBirth: timestamp("date_of_birth"),
  nhsNumber: varchar("nhs_number"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  emailNotifications: boolean("email_notifications").default(true),
  smsNotifications: boolean("sms_notifications").default(false),
  pushNotifications: boolean("push_notifications").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Addresses table
export const addresses = pgTable("addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  label: varchar("label").notNull(), // "Home", "Work", etc.
  line1: varchar("line1").notNull(),
  line2: varchar("line2"),
  city: varchar("city").notNull(),
  postcode: varchar("postcode").notNull(),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Prescriptions table
export const prescriptions = pgTable("prescriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => users.id).notNull(),
  prescriberId: varchar("prescriber_id").notNull(), // Doctor's ID or name
  prescriberName: varchar("prescriber_name").notNull(),
  medicationName: varchar("medication_name").notNull(),
  dosage: varchar("dosage").notNull(),
  quantity: integer("quantity").notNull(),
  refillsRemaining: integer("refills_remaining").default(0),
  instructions: text("instructions"),
  status: prescriptionStatusEnum("status").default("pending_review"),
  issuedDate: timestamp("issued_date").defaultNow(),
  expiryDate: timestamp("expiry_date"),
  lastFilledDate: timestamp("last_filled_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Orders table
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => users.id).notNull(),
  orderNumber: varchar("order_number").unique().notNull(),
  status: orderStatusEnum("status").default("pending_payment"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentIntentId: varchar("payment_intent_id"),
  deliveryMethod: varchar("delivery_method").notNull(), // "pickup" or "delivery"
  deliveryAddressId: varchar("delivery_address_id").references(() => addresses.id),
  estimatedReadyTime: timestamp("estimated_ready_time"),
  actualReadyTime: timestamp("actual_ready_time"),
  dispensedTime: timestamp("dispensed_time"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order items table
export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  prescriptionId: varchar("prescription_id").references(() => prescriptions.id),
  medicationName: varchar("medication_name").notNull(),
  dosage: varchar("dosage").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
});

// Product categories enum
export const productCategoryEnum = pgEnum("product_category", [
  "prescription_medicines",
  "over_the_counter",
  "vitamins_supplements",
  "first_aid",
  "baby_care",
  "health_wellness",
  "personal_care",
  "medical_devices"
]);

// Inventory table for stock management - enhanced for shop
export const inventory = pgTable("inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  medicationName: varchar("medication_name").notNull(),
  dosage: varchar("dosage").notNull(),
  description: text("description"),
  category: productCategoryEnum("category").default("over_the_counter"),
  imageUrl: varchar("image_url"),
  isActive: boolean("is_active").default(true),
  requiresPrescription: boolean("requires_prescription").default(false),
  currentStock: integer("current_stock").default(0),
  minimumStock: integer("minimum_stock").default(10),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  supplier: varchar("supplier"),
  expiryDate: timestamp("expiry_date"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Consultation status enum
export const consultationStatusEnum = pgEnum("consultation_status", [
  "scheduled",
  "in_progress", 
  "completed",
  "cancelled"
]);

// Consultation bookings table
export const consultations = pgTable("consultations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => users.id).notNull(),
  pharmacistId: varchar("pharmacist_id").references(() => users.id),
  type: varchar("type").notNull(), // "general", "medication_review", "prescription_query"
  status: consultationStatusEnum("status").default("scheduled"),
  scheduledDate: timestamp("scheduled_date").notNull(),
  duration: integer("duration").default(30), // minutes
  notes: text("notes"),
  meetingLink: varchar("meeting_link"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Prescription uploads table
export const prescriptionUploads = pgTable("prescription_uploads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => users.id).notNull(),
  fileName: varchar("file_name").notNull(),
  fileUrl: varchar("file_url").notNull(),
  status: varchar("status").default("pending"), // "pending", "processed", "approved", "rejected"
  ocrText: text("ocr_text"), // Extracted text from OCR
  notes: text("notes"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Shopping cart table
export const shoppingCart = pgTable("shopping_cart", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  inventoryId: varchar("inventory_id").references(() => inventory.id).notNull(),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: varchar("type").notNull(), // "prescription_ready", "order_update", etc.
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  relatedId: varchar("related_id"), // Reference to prescription/order ID
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  addresses: many(addresses),
  prescriptions: many(prescriptions),
  orders: many(orders),
  notifications: many(notifications),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, {
    fields: [addresses.userId],
    references: [users.id],
  }),
}));

export const prescriptionsRelations = relations(prescriptions, ({ one, many }) => ({
  patient: one(users, {
    fields: [prescriptions.patientId],
    references: [users.id],
  }),
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  patient: one(users, {
    fields: [orders.patientId],
    references: [users.id],
  }),
  deliveryAddress: one(addresses, {
    fields: [orders.deliveryAddressId],
    references: [addresses.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  prescription: one(prescriptions, {
    fields: [orderItems.prescriptionId],
    references: [prescriptions.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Auth-specific schema that includes ID for OIDC user creation
export const authUpsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertAddressSchema = createInsertSchema(addresses).omit({
  id: true,
  createdAt: true,
});

export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderNumber: true, // Auto-generated by storage layer
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertConsultationSchema = createInsertSchema(consultations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPrescriptionUploadSchema = createInsertSchema(prescriptionUploads).omit({
  id: true,
  createdAt: true,
});

export const insertShoppingCartSchema = createInsertSchema(shoppingCart).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type AuthUpsertUser = z.infer<typeof authUpsertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertAddress = z.infer<typeof insertAddressSchema>;
export type Address = typeof addresses.$inferSelect;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;
export type Prescription = typeof prescriptions.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Inventory = typeof inventory.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertConsultation = z.infer<typeof insertConsultationSchema>;
export type Consultation = typeof consultations.$inferSelect;
export type InsertPrescriptionUpload = z.infer<typeof insertPrescriptionUploadSchema>;
export type PrescriptionUpload = typeof prescriptionUploads.$inferSelect;
export type InsertShoppingCart = z.infer<typeof insertShoppingCartSchema>;
export type ShoppingCart = typeof shoppingCart.$inferSelect;
