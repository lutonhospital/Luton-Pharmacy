import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { sendPrescriptionStatusEmail, sendOrderConfirmationEmail } from "./emailService";
import Stripe from "stripe";
import { z } from "zod";
import { insertPrescriptionSchema, insertOrderSchema, insertAddressSchema, insertInventorySchema } from "@shared/schema";

// Use testing Stripe key if available, otherwise use production key
const stripeSecretKey = process.env.TESTING_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;

console.log('Stripe key configuration:', {
  hasTesting: !!process.env.TESTING_STRIPE_SECRET_KEY,
  hasProduction: !!process.env.STRIPE_SECRET_KEY,
  usingKey: stripeSecretKey ? 'key loaded' : 'none'
});

if (!stripeSecretKey) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY or TESTING_STRIPE_SECRET_KEY');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20",
});

// Centralized KES payment helper to ensure currency consistency
const createKesPaymentIntent = async (amountKes: number, orderId: string) => {
  const amountInCents = Math.round(amountKes * 100);
  console.log(`Creating KES payment intent: KES ${amountKes} -> ${amountInCents} cents`);
  
  return await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: "kes",
    metadata: {
      orderId,
    },
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const stats = await storage.getDashboardStats(userId, user.role || 'patient');
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Prescription routes
  app.get('/api/prescriptions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      let prescriptions;
      if (user?.role === 'pharmacist' || user?.role === 'admin') {
        prescriptions = await storage.getPendingPrescriptions();
      } else {
        prescriptions = await storage.getPatientPrescriptions(userId);
      }
      
      res.json(prescriptions);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      res.status(500).json({ message: "Failed to fetch prescriptions" });
    }
  });

  app.post('/api/prescriptions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'pharmacist' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const prescriptionData = insertPrescriptionSchema.parse(req.body);
      const prescription = await storage.createPrescription(prescriptionData);
      
      res.json(prescription);
    } catch (error) {
      console.error("Error creating prescription:", error);
      res.status(500).json({ message: "Failed to create prescription" });
    }
  });

  app.patch('/api/prescriptions/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'pharmacist' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      const { status, notes } = req.body;
      
      const prescription = await storage.updatePrescriptionStatus(id, status, notes);
      
      // Send email notification to patient
      const patient = await storage.getUser(prescription.patientId);
      if (patient?.email) {
        await sendPrescriptionStatusEmail(
          patient.email,
          `${patient.firstName} ${patient.lastName}`,
          prescription.medicationName,
          status
        );
      }
      
      res.json(prescription);
    } catch (error) {
      console.error("Error updating prescription status:", error);
      res.status(500).json({ message: "Failed to update prescription status" });
    }
  });

  // Order routes
  app.get('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      let orders;
      if (user?.role === 'pharmacist' || user?.role === 'admin') {
        orders = await storage.getPendingOrders();
      } else {
        orders = await storage.getPatientOrders(userId);
      }
      
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get('/api/orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      const order = await storage.getOrder(id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Ensure user can only access their own orders (unless they're staff)
      const user = await storage.getUser(userId);
      if (user?.role !== 'pharmacist' && user?.role !== 'admin' && order.patientId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orderData = { ...req.body, patientId: userId };
      
      const validatedOrder = insertOrderSchema.parse(orderData);
      const order = await storage.createOrder(validatedOrder);
      
      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.patch('/api/orders/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'pharmacist' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      const { status } = req.body;
      
      const order = await storage.updateOrderStatus(id, status);
      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Address routes
  app.get('/api/addresses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const addresses = await storage.getUserAddresses(userId);
      res.json(addresses);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      res.status(500).json({ message: "Failed to fetch addresses" });
    }
  });

  app.post('/api/addresses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const addressData = { ...req.body, userId };
      
      const validatedAddress = insertAddressSchema.parse(addressData);
      const address = await storage.createAddress(validatedAddress);
      
      res.json(address);
    } catch (error) {
      console.error("Error creating address:", error);
      res.status(500).json({ message: "Failed to create address" });
    }
  });

  app.patch('/api/addresses/:id/primary', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      await storage.setPrimaryAddress(userId, id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error setting primary address:", error);
      res.status(500).json({ message: "Failed to set primary address" });
    }
  });

  // Inventory routes (staff only)
  app.get('/api/inventory', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'pharmacist' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const inventory = await storage.getInventory();
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.get('/api/inventory/low-stock', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'pharmacist' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const lowStockItems = await storage.getLowStockItems();
      res.json(lowStockItems);
    } catch (error) {
      console.error("Error fetching low stock items:", error);
      res.status(500).json({ message: "Failed to fetch low stock items" });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationRead(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Payment routes
  app.post("/api/create-payment-intent", isAuthenticated, async (req: any, res) => {
    try {
      const { orderId } = req.body;
      const userId = req.user.claims.sub;
      
      if (!orderId) {
        return res.status(400).json({ message: "Order ID is required" });
      }

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Verify user owns this order (unless they're staff)
      const user = await storage.getUser(userId);
      if (user?.role !== 'pharmacist' && user?.role !== 'admin' && order.patientId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Use centralized KES payment helper
      const paymentIntent = await createKesPaymentIntent(
        parseFloat(order.totalAmount),
        order.id
      );

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  app.post("/api/confirm-payment", isAuthenticated, async (req: any, res) => {
    try {
      const { paymentIntentId, orderId } = req.body;
      const userId = req.user.claims.sub;
      
      // Update order with payment info
      const order = await storage.updateOrderPayment(orderId, paymentIntentId);
      
      // Get order items for email
      const orderItems = await storage.getOrderItems(orderId);
      
      // Send confirmation email
      const user = await storage.getUser(userId);
      if (user?.email) {
        const items = orderItems.map(item => ({
          medicationName: item.medicationName,
          quantity: item.quantity,
          price: item.totalPrice,
        }));
        
        await sendOrderConfirmationEmail(
          user.email,
          `${user.firstName} ${user.lastName}`,
          order.orderNumber,
          order.totalAmount,
          items
        );
      }
      
      res.json({ success: true, order });
    } catch (error: any) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ message: "Error confirming payment: " + error.message });
    }
  });

  // Shop product routes
  app.get("/api/products", async (req, res) => {
    try {
      const { category, search } = req.query;
      let products;

      if (search) {
        products = await storage.searchProducts(search as string);
      } else if (category && category !== "all") {
        products = await storage.getProductsByCategory(category as string);
      } else {
        products = await storage.getActiveProducts();
      }

      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const { search } = req.query;
      
      let products;
      if (search) {
        products = await storage.searchProducts(search as string);
      } else if (category === "all") {
        products = await storage.getActiveProducts();
      } else {
        products = await storage.getProductsByCategory(category);
      }

      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Shopping cart routes
  app.get("/api/cart", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cartItems = await storage.getUserCart(userId);
      
      // Fetch product details for each cart item
      const enrichedCartItems = await Promise.all(
        cartItems.map(async (item) => {
          const products = await storage.getActiveProducts();
          const product = products.find(p => p.id === item.inventoryId);
          return { ...item, product };
        })
      );

      res.json(enrichedCartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { inventoryId, quantity } = req.body;

      const cartItem = await storage.addToCart({
        userId,
        inventoryId,
        quantity: quantity || 1,
      });

      res.json(cartItem);
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(500).json({ message: "Failed to add to cart" });
    }
  });

  app.patch("/api/cart/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { quantity } = req.body;

      const cartItem = await storage.updateCartItem(id, quantity);
      res.json(cartItem);
    } catch (error) {
      console.error("Error updating cart item:", error);
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.removeFromCart(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ message: "Failed to remove from cart" });
    }
  });

  // Admin product management routes
  app.get("/api/admin/products", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'admin' && user.role !== 'pharmacist')) {
        return res.status(403).json({ message: "Access denied. Admin or pharmacist role required." });
      }

      const products = await storage.getAllInventory();
      res.json(products);
    } catch (error) {
      console.error("Error fetching admin products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post("/api/admin/products", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'admin' && user.role !== 'pharmacist')) {
        return res.status(403).json({ message: "Access denied. Admin or pharmacist role required." });
      }

      try {
        const validatedData = insertInventorySchema.parse(req.body);
        const product = await storage.createInventoryItem(validatedData);
        res.json(product);
      } catch (error: any) {
        if (error.name === 'ZodError') {
          return res.status(400).json({ message: "Validation error", errors: error.errors });
        }
        throw error;
      }
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.patch("/api/admin/products/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'admin' && user.role !== 'pharmacist')) {
        return res.status(403).json({ message: "Access denied. Admin or pharmacist role required." });
      }

      const { id } = req.params;
      try {
        const validatedData = insertInventorySchema.partial().parse(req.body);
        const product = await storage.updateInventoryItem(id, validatedData);
        res.json(product);
      } catch (error: any) {
        if (error.name === 'ZodError') {
          return res.status(400).json({ message: "Validation error", errors: error.errors });
        }
        throw error;
      }
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/admin/products/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'admin' && user.role !== 'pharmacist')) {
        return res.status(403).json({ message: "Access denied. Admin or pharmacist role required." });
      }

      const { id } = req.params;
      await storage.deleteInventoryItem(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
