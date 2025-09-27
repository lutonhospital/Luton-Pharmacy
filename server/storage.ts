import {
  users,
  addresses,
  prescriptions,
  orders,
  orderItems,
  inventory,
  notifications,
  consultations,
  prescriptionUploads,
  shoppingCart,
  passwordResetTokens,
  type User,
  type UpsertUser,
  type AuthUpsertUser,
  type Address,
  type InsertAddress,
  type Prescription,
  type InsertPrescription,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type Inventory,
  type InsertInventory,
  type Notification,
  type InsertNotification,
  type Consultation,
  type InsertConsultation,
  type PrescriptionUpload,
  type InsertPrescriptionUpload,
  type ShoppingCart,
  type InsertShoppingCart,
  type PasswordResetToken,
  type InsertPasswordResetToken,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, count, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  upsertAuthUser(user: AuthUpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, customerId: string, subscriptionId?: string): Promise<User>;
  
  // Admin user management operations
  getAllUsers(): Promise<Omit<User, 'password'>[]>;
  createUser(user: { email: string; password: string; firstName?: string | null; lastName?: string | null; role: string }): Promise<User>;
  updateUser(id: string, data: Partial<{ email: string; password: string; firstName?: string | null; lastName?: string | null; role: string }>): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // Address operations
  getUserAddresses(userId: string): Promise<Address[]>;
  createAddress(address: InsertAddress): Promise<Address>;
  updateAddress(id: string, address: Partial<InsertAddress>): Promise<Address>;
  deleteAddress(id: string): Promise<void>;
  setPrimaryAddress(userId: string, addressId: string): Promise<void>;

  // Prescription operations
  getPatientPrescriptions(patientId: string): Promise<Prescription[]>;
  getPrescription(id: string): Promise<Prescription | undefined>;
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  updatePrescriptionStatus(id: string, status: string, notes?: string): Promise<Prescription>;
  getPendingPrescriptions(): Promise<Prescription[]>;

  // Order operations
  getPatientOrders(patientId: string): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order>;
  updateOrderPayment(id: string, paymentIntentId: string): Promise<Order>;
  updateOrderWithPaymentInfo(id: string, paymentMethod: string, mpesaReceiptNumber?: string): Promise<Order>;
  getPendingOrders(): Promise<Order[]>;

  // Order item operations
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;

  // Inventory operations
  getInventory(): Promise<Inventory[]>;
  getInventoryItem(medicationName: string, dosage: string): Promise<Inventory | undefined>;
  getInventoryById(id: string): Promise<Inventory | undefined>;
  updateInventoryStock(id: string, newStock: number): Promise<Inventory>;
  getLowStockItems(): Promise<Inventory[]>;
  // Admin inventory management
  getAllInventory(): Promise<Inventory[]>;
  createInventoryItem(data: InsertInventory): Promise<Inventory>;
  updateInventoryItem(id: string, data: Partial<InsertInventory>): Promise<Inventory>;
  deleteInventoryItem(id: string): Promise<void>;

  // Notification operations
  getUserNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;

  // Shopping cart operations
  getUserCart(userId: string): Promise<ShoppingCart[]>;
  addToCart(item: InsertShoppingCart): Promise<ShoppingCart>;
  updateCartItem(id: string, quantity: number): Promise<ShoppingCart>;
  removeFromCart(id: string): Promise<void>;
  clearCart(userId: string): Promise<void>;

  // Consultation operations
  getConsultations(userId: string): Promise<Consultation[]>;
  createConsultation(consultation: InsertConsultation): Promise<Consultation>;
  updateConsultationStatus(id: string, status: string, notes?: string): Promise<Consultation>;
  getPendingConsultations(): Promise<Consultation[]>;

  // Prescription upload operations
  getUserPrescriptionUploads(userId: string): Promise<PrescriptionUpload[]>;
  createPrescriptionUpload(upload: InsertPrescriptionUpload): Promise<PrescriptionUpload>;
  updatePrescriptionUploadStatus(id: string, status: string, notes?: string): Promise<PrescriptionUpload>;
  getPendingPrescriptionUploads(): Promise<PrescriptionUpload[]>;

  // Enhanced inventory operations for shop
  getActiveProducts(category?: string): Promise<Inventory[]>;
  searchProducts(query: string): Promise<Inventory[]>;
  getProductsByCategory(category: string): Promise<Inventory[]>;

  // Analytics
  getDashboardStats(userId: string, role: string): Promise<any>;

  // Admin-specific analytics methods
  getOrderCountByStatus(status: string): Promise<number>;
  getTotalOrderCount(): Promise<number>;
  getSalesToday(): Promise<number>;
  getSalesThisWeek(): Promise<number>;
  getSalesThisMonth(): Promise<number>;
  getPaidRevenue(): Promise<number>;
  getPendingRevenue(): Promise<number>;
  getLowStockCount(): Promise<number>;
  getPendingConsultationCount(): Promise<number>;
  getTotalProductCount(): Promise<number>;
  getActiveUserCount(): Promise<number>;

  // Admin data retrieval with details
  getAllOrdersWithDetails(): Promise<any[]>;
  getAllPrescriptionUploadsWithPatientDetails(): Promise<any[]>;
  getAllConsultationsWithPatientDetails(): Promise<any[]>;
  updateConsultation(id: string, updates: Partial<InsertConsultation>): Promise<Consultation>;

  // Password reset token operations
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenUsed(token: string): Promise<void>;
  cleanupExpiredTokens(): Promise<void>;
  cleanupUserPasswordResetTokens(email: string, userType: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async upsertAuthUser(userData: AuthUpsertUser): Promise<User> {
    // Check if user exists by email first (for migration cases)
    if (userData.email) {
      const [existingUserByEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email));
        
      if (existingUserByEmail) {
        // Update existing user without changing ID
        const [updatedUser] = await db
          .update(users)
          .set({
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            // Preserve existing role - don't overwrite from OIDC
            updatedAt: new Date(),
          })
          .where(eq(users.email, userData.email))
          .returning();
        return updatedUser;
      }
    }
    
    // If no existing user by email, try normal upsert by ID
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, customerId: string, subscriptionId?: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Address operations
  async getUserAddresses(userId: string): Promise<Address[]> {
    return await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, userId))
      .orderBy(desc(addresses.isPrimary), asc(addresses.createdAt));
  }

  async createAddress(address: InsertAddress): Promise<Address> {
    const [newAddress] = await db
      .insert(addresses)
      .values(address)
      .returning();
    return newAddress;
  }

  async updateAddress(id: string, address: Partial<InsertAddress>): Promise<Address> {
    const [updatedAddress] = await db
      .update(addresses)
      .set(address)
      .where(eq(addresses.id, id))
      .returning();
    return updatedAddress;
  }

  async deleteAddress(id: string): Promise<void> {
    await db.delete(addresses).where(eq(addresses.id, id));
  }

  async setPrimaryAddress(userId: string, addressId: string): Promise<void> {
    // First, set all addresses to non-primary
    await db
      .update(addresses)
      .set({ isPrimary: false })
      .where(eq(addresses.userId, userId));

    // Then set the specified address as primary
    await db
      .update(addresses)
      .set({ isPrimary: true })
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)));
  }

  // Prescription operations
  async getPatientPrescriptions(patientId: string): Promise<Prescription[]> {
    return await db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.patientId, patientId))
      .orderBy(desc(prescriptions.createdAt));
  }

  async getPrescription(id: string): Promise<Prescription | undefined> {
    const [prescription] = await db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.id, id));
    return prescription;
  }

  async createPrescription(prescription: InsertPrescription): Promise<Prescription> {
    const [newPrescription] = await db
      .insert(prescriptions)
      .values(prescription)
      .returning();
    return newPrescription;
  }

  async updatePrescriptionStatus(id: string, status: string, notes?: string): Promise<Prescription> {
    const updateData: any = { 
      status,
      updatedAt: new Date()
    };
    
    if (notes) {
      updateData.notes = notes;
    }

    if (status === "dispensed") {
      updateData.lastFilledDate = new Date();
    }

    const [updatedPrescription] = await db
      .update(prescriptions)
      .set(updateData)
      .where(eq(prescriptions.id, id))
      .returning();
    return updatedPrescription;
  }

  async getPendingPrescriptions(): Promise<Prescription[]> {
    return await db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.status, "pending_review"))
      .orderBy(asc(prescriptions.createdAt));
  }

  // Order operations
  async getPatientOrders(patientId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.patientId, patientId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id));
    return order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const orderNumber = `PHR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const [newOrder] = await db
      .insert(orders)
      .values({
        ...order,
        orderNumber,
      })
      .returning();
    return newOrder;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const updateData: any = { 
      status,
      updatedAt: new Date()
    };

    if (status === "ready") {
      updateData.actualReadyTime = new Date();
    } else if (status === "completed") {
      updateData.dispensedTime = new Date();
    }

    const [updatedOrder] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async updateOrderPayment(id: string, paymentIntentId: string): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({
        paymentIntentId,
        status: "paid",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async updateOrderWithPaymentInfo(id: string, paymentMethod: string, mpesaReceiptNumber?: string): Promise<Order> {
    const updateData: any = {
      paymentMethod,
      status: paymentMethod === 'cash' ? 'pending_payment' : 'paid',
      updatedAt: new Date(),
    };

    if (paymentMethod === 'mpesa' && mpesaReceiptNumber) {
      updateData.mpesaReceiptNumber = mpesaReceiptNumber;
    }

    const [updatedOrder] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async getPendingOrders(): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.status, "processing"))
      .orderBy(asc(orders.createdAt));
  }

  // Order item operations
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [newItem] = await db
      .insert(orderItems)
      .values(item)
      .returning();
    return newItem;
  }

  // Inventory operations
  async getInventory(): Promise<Inventory[]> {
    return await db
      .select()
      .from(inventory)
      .orderBy(asc(inventory.medicationName));
  }

  async getInventoryItem(medicationName: string, dosage: string): Promise<Inventory | undefined> {
    const [item] = await db
      .select()
      .from(inventory)
      .where(and(
        eq(inventory.medicationName, medicationName),
        eq(inventory.dosage, dosage)
      ));
    return item;
  }

  async getInventoryById(id: string): Promise<Inventory | undefined> {
    const [item] = await db
      .select()
      .from(inventory)
      .where(eq(inventory.id, id));
    return item;
  }

  async updateInventoryStock(id: string, newStock: number): Promise<Inventory> {
    const [updatedItem] = await db
      .update(inventory)
      .set({
        currentStock: newStock,
        updatedAt: new Date(),
      })
      .where(eq(inventory.id, id))
      .returning();
    return updatedItem;
  }

  async getLowStockItems(): Promise<Inventory[]> {
    return await db
      .select()
      .from(inventory)
      .where(sql`current_stock <= minimum_stock`)
      .orderBy(asc(inventory.currentStock));
  }

  // Admin inventory management
  async getAllInventory(): Promise<Inventory[]> {
    return await db
      .select()
      .from(inventory)
      .orderBy(asc(inventory.medicationName));
  }

  async createInventoryItem(data: InsertInventory): Promise<Inventory> {
    const [newItem] = await db
      .insert(inventory)
      .values(data)
      .returning();
    return newItem;
  }

  async updateInventoryItem(id: string, data: Partial<InsertInventory>): Promise<Inventory> {
    const [updatedItem] = await db
      .update(inventory)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(inventory.id, id))
      .returning();
    return updatedItem;
  }

  async deleteInventoryItem(id: string): Promise<void> {
    await db
      .delete(inventory)
      .where(eq(inventory.id, id));
  }

  // Notification operations
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async markNotificationRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  // Analytics
  async getDashboardStats(userId: string, role: string): Promise<any> {
    if (role === "patient") {
      const [activePrescriptions] = await db
        .select({ count: count() })
        .from(prescriptions)
        .where(and(
          eq(prescriptions.patientId, userId),
          eq(prescriptions.status, "approved")
        ));

      const [pendingOrders] = await db
        .select({ count: count() })
        .from(orders)
        .where(and(
          eq(orders.patientId, userId),
          eq(orders.status, "processing")
        ));

      const [readyForPickup] = await db
        .select({ count: count() })
        .from(orders)
        .where(and(
          eq(orders.patientId, userId),
          eq(orders.status, "ready")
        ));

      return {
        activePrescriptions: activePrescriptions.count,
        pendingOrders: pendingOrders.count,
        readyForPickup: readyForPickup.count,
      };
    } else {
      const [pendingApprovals] = await db
        .select({ count: count() })
        .from(prescriptions)
        .where(eq(prescriptions.status, "pending_review"));

      const [readyForPickup] = await db
        .select({ count: count() })
        .from(orders)
        .where(eq(orders.status, "ready"));

      const [inProgress] = await db
        .select({ count: count() })
        .from(orders)
        .where(eq(orders.status, "processing"));

      const lowStockItems = await this.getLowStockItems();

      return {
        pendingApprovals: pendingApprovals.count,
        readyForPickup: readyForPickup.count,
        inProgress: inProgress.count,
        stockAlerts: lowStockItems.length,
      };
    }
  }

  // Shopping cart operations
  async getUserCart(userId: string): Promise<ShoppingCart[]> {
    return await db
      .select()
      .from(shoppingCart)
      .where(eq(shoppingCart.userId, userId))
      .orderBy(desc(shoppingCart.createdAt));
  }

  async addToCart(item: InsertShoppingCart): Promise<ShoppingCart> {
    // Check if item already exists in cart
    const [existingItem] = await db
      .select()
      .from(shoppingCart)
      .where(and(
        eq(shoppingCart.userId, item.userId),
        eq(shoppingCart.inventoryId, item.inventoryId)
      ));

    if (existingItem) {
      // Update quantity
      const [updatedItem] = await db
        .update(shoppingCart)
        .set({
          quantity: (existingItem.quantity || 0) + (item.quantity || 0),
          updatedAt: new Date()
        })
        .where(eq(shoppingCart.id, existingItem.id))
        .returning();
      return updatedItem;
    } else {
      // Add new item
      const [newItem] = await db
        .insert(shoppingCart)
        .values(item)
        .returning();
      return newItem;
    }
  }

  async updateCartItem(id: string, quantity: number): Promise<ShoppingCart> {
    const [updatedItem] = await db
      .update(shoppingCart)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(shoppingCart.id, id))
      .returning();
    return updatedItem;
  }

  async removeFromCart(id: string): Promise<void> {
    await db.delete(shoppingCart).where(eq(shoppingCart.id, id));
  }

  async clearCart(userId: string): Promise<void> {
    await db.delete(shoppingCart).where(eq(shoppingCart.userId, userId));
  }

  // Consultation operations
  async getConsultations(userId: string): Promise<Consultation[]> {
    return await db
      .select()
      .from(consultations)
      .where(eq(consultations.patientId, userId))
      .orderBy(desc(consultations.scheduledDate));
  }

  async createConsultation(consultation: InsertConsultation): Promise<Consultation> {
    const [newConsultation] = await db
      .insert(consultations)
      .values(consultation)
      .returning();
    return newConsultation;
  }

  async updateConsultationStatus(id: string, status: string, notes?: string): Promise<Consultation> {
    const updateData: any = { status, updatedAt: new Date() };
    if (notes) updateData.notes = notes;

    const [updatedConsultation] = await db
      .update(consultations)
      .set(updateData)
      .where(eq(consultations.id, id))
      .returning();
    return updatedConsultation;
  }

  async getPendingConsultations(): Promise<Consultation[]> {
    return await db
      .select()
      .from(consultations)
      .where(eq(consultations.status, "scheduled"))
      .orderBy(asc(consultations.scheduledDate));
  }

  // Prescription upload operations
  async getUserPrescriptionUploads(userId: string): Promise<PrescriptionUpload[]> {
    return await db
      .select()
      .from(prescriptionUploads)
      .where(eq(prescriptionUploads.patientId, userId))
      .orderBy(desc(prescriptionUploads.createdAt));
  }

  async createPrescriptionUpload(upload: InsertPrescriptionUpload): Promise<PrescriptionUpload> {
    const [newUpload] = await db
      .insert(prescriptionUploads)
      .values(upload)
      .returning();
    return newUpload;
  }

  async updatePrescriptionUploadStatus(id: string, status: string, notes?: string): Promise<PrescriptionUpload> {
    const updateData: any = { status, processedAt: new Date() };
    if (notes) updateData.notes = notes;

    const [updatedUpload] = await db
      .update(prescriptionUploads)
      .set(updateData)
      .where(eq(prescriptionUploads.id, id))
      .returning();
    return updatedUpload;
  }

  async getPendingPrescriptionUploads(): Promise<PrescriptionUpload[]> {
    return await db
      .select()
      .from(prescriptionUploads)
      .where(eq(prescriptionUploads.status, "pending"))
      .orderBy(asc(prescriptionUploads.createdAt));
  }

  // Enhanced inventory operations for shop
  async getActiveProducts(category?: string): Promise<Inventory[]> {
    if (category) {
      return await db
        .select()
        .from(inventory)
        .where(and(
          eq(inventory.isActive, true),
          sql`${inventory.category} = ${category}`
        ))
        .orderBy(asc(inventory.medicationName));
    }
    
    return await db
      .select()
      .from(inventory)
      .where(eq(inventory.isActive, true))
      .orderBy(asc(inventory.medicationName));
  }

  async searchProducts(searchQuery: string): Promise<Inventory[]> {
    return await db
      .select()
      .from(inventory)
      .where(and(
        eq(inventory.isActive, true),
        sql`${inventory.medicationName} ILIKE ${'%' + searchQuery + '%'}`
      ))
      .orderBy(asc(inventory.medicationName));
  }

  async getProductsByCategory(category: string): Promise<Inventory[]> {
    return await db
      .select()
      .from(inventory)
      .where(and(
        eq(inventory.isActive, true),
        sql`${inventory.category} = ${category}`
      ))
      .orderBy(asc(inventory.medicationName));
  }

  // Admin-specific analytics implementations
  async getOrderCountByStatus(status: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(orders)
      .where(sql`${orders.status} = ${status}`);
    return result.count;
  }

  async getTotalOrderCount(): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(orders);
    return result.count;
  }

  async getSalesToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [result] = await db
      .select({ count: count() })
      .from(orders)
      .where(and(
        sql`${orders.createdAt} >= ${today}`,
        sql`${orders.createdAt} < ${tomorrow}`,
        sql`${orders.status} IN ('paid', 'processing', 'ready', 'completed')`
      ));
    return result.count;
  }

  async getSalesThisWeek(): Promise<number> {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const [result] = await db
      .select({ count: count() })
      .from(orders)
      .where(and(
        sql`${orders.createdAt} >= ${weekStart}`,
        sql`${orders.status} IN ('paid', 'processing', 'ready', 'completed')`
      ));
    return result.count;
  }

  async getSalesThisMonth(): Promise<number> {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [result] = await db
      .select({ count: count() })
      .from(orders)
      .where(and(
        sql`${orders.createdAt} >= ${monthStart}`,
        sql`${orders.status} IN ('paid', 'processing', 'ready', 'completed')`
      ));
    return result.count;
  }

  async getPaidRevenue(): Promise<number> {
    const [result] = await db
      .select({ total: sql<number>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)` })
      .from(orders)
      .where(sql`${orders.status} IN ('paid', 'processing', 'ready', 'completed')`);
    return Number(result.total) || 0;
  }

  async getPendingRevenue(): Promise<number> {
    const [result] = await db
      .select({ total: sql<number>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)` })
      .from(orders)
      .where(eq(orders.status, 'pending_payment'));
    return Number(result.total) || 0;
  }

  async getLowStockCount(): Promise<number> {
    const lowStockItems = await this.getLowStockItems();
    return lowStockItems.length;
  }

  async getPendingConsultationCount(): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(consultations)
      .where(eq(consultations.status, 'scheduled'));
    return result.count;
  }

  async getTotalProductCount(): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(inventory)
      .where(eq(inventory.isActive, true));
    return result.count;
  }

  async getActiveUserCount(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Use updatedAt as a proxy for activity since lastLoginAt doesn't exist
    const [result] = await db
      .select({ count: count() })
      .from(users)
      .where(sql`${users.updatedAt} >= ${thirtyDaysAgo}`);
    return result.count;
  }

  async getAllOrdersWithDetails(): Promise<any[]> {
    const ordersWithUsers = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        patientId: orders.patientId,
        status: orders.status,
        totalAmount: orders.totalAmount,
        paymentIntentId: orders.paymentIntentId,
        deliveryMethod: orders.deliveryMethod,
        deliveryAddressId: orders.deliveryAddressId,
        estimatedReadyTime: orders.estimatedReadyTime,
        actualReadyTime: orders.actualReadyTime,
        dispensedTime: orders.dispensedTime,
        notes: orders.notes,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        // User details
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
        userPhone: users.phone
      })
      .from(orders)
      .leftJoin(users, eq(orders.patientId, users.id))
      .orderBy(desc(orders.createdAt));

    // Transform to match frontend interface and get order items
    const ordersWithDetails = await Promise.all(
      ordersWithUsers.map(async (order) => {
        const items = await this.getOrderItems(order.id);
        
        return {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          totalAmount: order.totalAmount,
          paymentIntentId: order.paymentIntentId,
          deliveryMethod: order.deliveryMethod,
          deliveryAddressId: order.deliveryAddressId,
          estimatedReadyTime: order.estimatedReadyTime,
          actualReadyTime: order.actualReadyTime,
          dispensedTime: order.dispensedTime,
          notes: order.notes,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          patient: {
            id: order.patientId,
            firstName: order.userFirstName || '',
            lastName: order.userLastName || '',
            email: order.userEmail || '',
            phone: order.userPhone || undefined
          },
          items: items
        };
      })
    );

    return ordersWithDetails;
  }

  async getAllPrescriptionUploadsWithPatientDetails(): Promise<any[]> {
    return await db
      .select({
        id: prescriptionUploads.id,
        patientId: prescriptionUploads.patientId,
        patientName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        patientEmail: users.email,
        fileName: prescriptionUploads.fileName,
        fileUrl: prescriptionUploads.fileUrl,
        status: prescriptionUploads.status,
        notes: prescriptionUploads.notes,
        createdAt: prescriptionUploads.createdAt,
        processedAt: prescriptionUploads.processedAt
      })
      .from(prescriptionUploads)
      .leftJoin(users, eq(prescriptionUploads.patientId, users.id))
      .orderBy(desc(prescriptionUploads.createdAt));
  }

  async getAllConsultationsWithPatientDetails(): Promise<any[]> {
    return await db
      .select({
        id: consultations.id,
        patientId: consultations.patientId,
        patientName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        patientEmail: users.email,
        type: consultations.type,
        scheduledDate: consultations.scheduledDate,
        duration: consultations.duration,
        status: consultations.status,
        notes: consultations.notes,
        createdAt: consultations.createdAt
      })
      .from(consultations)
      .leftJoin(users, eq(consultations.patientId, users.id))
      .orderBy(desc(consultations.scheduledDate));
  }

  async updateConsultation(id: string, updates: Partial<InsertConsultation>): Promise<Consultation> {
    const [updatedConsultation] = await db
      .update(consultations)
      .set(updates)
      .where(eq(consultations.id, id))
      .returning();
    return updatedConsultation;
  }

  // Admin user management implementations
  async getAllUsers(): Promise<Omit<User, 'password'>[]> {
    const allUsers = await db.select().from(users).orderBy(asc(users.createdAt));
    // Remove password field from all users
    return allUsers.map(({ password, ...user }) => user);
  }

  async createUser(userData: { email: string; password: string; firstName?: string | null; lastName?: string | null; role: string }): Promise<User> {
    const [newUser] = await db
      .insert(users)
      .values({
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        role: userData.role as "patient" | "pharmacist" | "admin" | "super_admin"
      })
      .returning();
    return newUser;
  }

  async updateUser(id: string, data: Partial<{ email: string; password: string; firstName?: string | null; lastName?: string | null; role: string }>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role as "patient" | "pharmacist" | "admin" | "super_admin" | undefined
      })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Password reset token operations
  async createPasswordResetToken(tokenData: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [token] = await db
      .insert(passwordResetTokens)
      .values(tokenData)
      .returning();
    return token;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    // Hash the provided token to compare with stored hash
    const crypto = await import('crypto');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    console.log(`Looking up token - Raw token length: ${token.length}, Hashed token: ${tokenHash.substring(0, 16)}...`);
    
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.token, tokenHash),
        eq(passwordResetTokens.isUsed, false),
        sql`expires_at > NOW()`
      ));
      
    console.log(`Token lookup result: ${resetToken ? `Found token for ${resetToken.email}` : 'No token found'}`);
    
    return resetToken;
  }

  async markPasswordResetTokenUsed(token: string): Promise<void> {
    // Hash the provided token to find the stored record
    const crypto = await import('crypto');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    await db
      .update(passwordResetTokens)
      .set({ isUsed: true })
      .where(eq(passwordResetTokens.token, tokenHash));
  }

  async cleanupExpiredTokens(): Promise<void> {
    await db
      .delete(passwordResetTokens)
      .where(sql`expires_at < NOW()`);
  }

  async cleanupUserPasswordResetTokens(email: string, userType: string): Promise<void> {
    await db
      .delete(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.email, email),
        eq(passwordResetTokens.userType, userType)
      ));
  }
}

export const storage = new DatabaseStorage();
