import {
  users,
  addresses,
  prescriptions,
  orders,
  orderItems,
  inventory,
  notifications,
  type User,
  type UpsertUser,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, count, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, customerId: string, subscriptionId?: string): Promise<User>;

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
  getPendingOrders(): Promise<Order[]>;

  // Order item operations
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;

  // Inventory operations
  getInventory(): Promise<Inventory[]>;
  getInventoryItem(medicationName: string, dosage: string): Promise<Inventory | undefined>;
  updateInventoryStock(id: string, newStock: number): Promise<Inventory>;
  getLowStockItems(): Promise<Inventory[]>;

  // Notification operations
  getUserNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;

  // Analytics
  getDashboardStats(userId: string, role: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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
}

export const storage = new DatabaseStorage();
