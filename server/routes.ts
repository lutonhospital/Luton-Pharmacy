import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { sendPrescriptionStatusEmail, sendOrderConfirmationEmail } from "./emailService";
import Stripe from "stripe";
import { z } from "zod";
import { insertPrescriptionSchema, insertOrderSchema, insertAddressSchema, insertInventorySchema, insertPrescriptionUploadSchema, insertConsultationSchema } from "@shared/schema";

// Admin validation schemas
const adminOrderUpdateSchema = z.object({
  status: z.enum(['pending_payment', 'paid', 'processing', 'ready', 'completed', 'cancelled']),
  notes: z.string().optional()
});

const adminPrescriptionVerificationSchema = z.object({
  action: z.enum(['approve', 'reject', 'flag', 'processed']),
  notes: z.string().optional(),
  prescriptionData: z.object({
    medicationName: z.string(),
    dosage: z.string(),
    instructions: z.string(),
    quantity: z.number().int().positive()
  }).optional()
});

const adminConsultationUpdateSchema = z.object({
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show']).optional(),
  notes: z.string().optional(),
  duration: z.number().int().positive().optional(),
  scheduledDate: z.string().datetime().optional()
});

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

  // Admin authentication routes
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      console.log('Admin login attempt:', { 
        username: username ? `"${username}"` : undefined, 
        password: password ? '[PASSWORD PROVIDED]' : undefined,
        envUsername: process.env.ADMIN_USERNAME ? `"${process.env.ADMIN_USERNAME}"` : undefined,
        envPassword: process.env.ADMIN_PASSWORD ? '[ENV PASSWORD SET]' : undefined
      });

      if (!username || !password) {
        console.log('Admin login failed: missing credentials');
        return res.status(400).json({ message: "Username and password are required" });
      }

      // Check credentials against environment variables
      if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
        console.log('Admin login failed: credential mismatch');
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Create admin session
      (req as any).session.adminUser = {
        id: 'admin',
        username: username,
        role: 'admin',
        isAdmin: true,
        loginTime: new Date()
      };

      res.json({ 
        message: "Login successful",
        user: {
          id: 'admin',
          username: username,
          role: 'admin',
          firstName: 'Admin',
          lastName: 'User'
        }
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get('/api/admin/auth/user', async (req, res) => {
    try {
      const adminUser = (req as any).session?.adminUser;
      
      if (!adminUser || !adminUser.isAdmin) {
        return res.status(401).json({ message: "Not authenticated as admin" });
      }

      res.json({
        id: adminUser.id,
        username: adminUser.username,
        role: adminUser.role,
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@lutonhospital.co.ke',
        isAdmin: true
      });
    } catch (error) {
      console.error("Admin auth check error:", error);
      res.status(500).json({ message: "Authentication check failed" });
    }
  });

  app.post('/api/admin/logout', async (req, res) => {
    try {
      delete (req as any).session.adminUser;
      res.json({ message: "Logout successful" });
    } catch (error) {
      console.error("Admin logout error:", error);
      res.status(500).json({ message: "Logout failed" });
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

  // Prescription Upload routes
  app.get('/api/prescription-uploads', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      let uploads;
      if (user?.role === 'pharmacist' || user?.role === 'admin') {
        // Staff can see all pending uploads
        uploads = await storage.getPendingPrescriptionUploads();
      } else {
        // Patients can only see their own uploads
        uploads = await storage.getUserPrescriptionUploads(userId);
      }
      
      res.json(uploads);
    } catch (error) {
      console.error("Error fetching prescription uploads:", error);
      res.status(500).json({ message: "Failed to fetch prescription uploads" });
    }
  });

  app.post('/api/prescription-uploads', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate request body using shared schema
      const validationResult = insertPrescriptionUploadSchema.safeParse({
        patientId: userId,
        fileName: req.body.fileName,
        fileUrl: req.body.fileUrl || `https://storage.lutonhospital.co.ke/prescriptions/${userId}/${Date.now()}-${req.body.fileName}`,
        notes: req.body.notes || null,
        status: "pending"
      });

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid request data",
          errors: validationResult.error.errors 
        });
      }

      const upload = await storage.createPrescriptionUpload(validationResult.data);
      
      res.json(upload);
    } catch (error) {
      console.error("Error creating prescription upload:", error);
      res.status(500).json({ message: "Failed to upload prescription" });
    }
  });

  app.patch('/api/prescription-uploads/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'pharmacist' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      const { status, notes } = req.body;
      
      const upload = await storage.updatePrescriptionUploadStatus(id, status, notes);
      
      res.json(upload);
    } catch (error) {
      console.error("Error updating prescription upload status:", error);
      res.status(500).json({ message: "Failed to update prescription upload status" });
    }
  });

  // Consultation routes
  app.get('/api/consultations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      let consultations;
      if (user?.role === 'pharmacist' || user?.role === 'admin') {
        // Staff can see all pending consultations
        consultations = await storage.getPendingConsultations();
      } else {
        // Patients can only see their own consultations
        consultations = await storage.getConsultations(userId);
      }
      
      res.json(consultations);
    } catch (error) {
      console.error("Error fetching consultations:", error);
      res.status(500).json({ message: "Failed to fetch consultations" });
    }
  });

  app.post('/api/consultations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate request body using shared schema
      const validationResult = insertConsultationSchema.safeParse({
        patientId: userId,
        type: req.body.type,
        scheduledDate: req.body.scheduledDate,
        duration: req.body.duration || 30,
        notes: req.body.notes || null,
        status: "scheduled"
      });

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid request data",
          errors: validationResult.error.errors 
        });
      }

      const consultation = await storage.createConsultation(validationResult.data);
      
      res.json(consultation);
    } catch (error) {
      console.error("Error creating consultation:", error);
      res.status(500).json({ message: "Failed to create consultation" });
    }
  });

  app.patch('/api/consultations/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'pharmacist' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      const { status, notes } = req.body;
      
      const consultation = await storage.updateConsultationStatus(id, status, notes);
      
      res.json(consultation);
    } catch (error) {
      console.error("Error updating consultation status:", error);
      res.status(500).json({ message: "Failed to update consultation status" });
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
      const { category, search, limit, random } = req.query;
      let products;

      if (search) {
        products = await storage.searchProducts(search as string);
      } else if (category && category !== "all") {
        products = await storage.getProductsByCategory(category as string);
      } else {
        products = await storage.getActiveProducts();
      }

      // Handle limit and random parameters
      if (products && limit) {
        const limitNum = parseInt(limit as string);
        if (!isNaN(limitNum) && limitNum > 0) {
          if (random === "true") {
            // Shuffle array and take limited number
            products = [...products].sort(() => Math.random() - 0.5).slice(0, limitNum);
          } else {
            // Just take limited number
            products = products.slice(0, limitNum);
          }
        }
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

  // CSV Import endpoint for pharmaceutical products
  app.post("/api/admin/import-products", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const { csvData } = req.body;
      if (!csvData || !Array.isArray(csvData)) {
        return res.status(400).json({ message: "Invalid CSV data format" });
      }

      const results = {
        imported: 0,
        errors: [] as any[],
        skipped: 0
      };

      // Helper function to clean price and convert to decimal
      const cleanPrice = (priceStr: string): number => {
        if (!priceStr || priceStr === '0') return 0;
        // Remove commas and quotes, parse as float
        const cleaned = priceStr.replace(/[",]/g, '');
        const price = parseFloat(cleaned);
        return isNaN(price) ? 0 : price;
      };

      // Helper function to map category
      const mapCategory = (collection: string): string => {
        const collectionLower = (collection || '').toLowerCase();
        // Map to our predefined categories
        if (collectionLower.includes('vitamin') || collectionLower.includes('supplement')) {
          return 'vitamins_supplements';
        }
        if (collectionLower.includes('prescription') || collectionLower.includes('rx')) {
          return 'prescription_medicines';
        }
        if (collectionLower.includes('first aid') || collectionLower.includes('emergency')) {
          return 'first_aid';
        }
        if (collectionLower.includes('baby') || collectionLower.includes('infant')) {
          return 'baby_care';
        }
        if (collectionLower.includes('device') || collectionLower.includes('equipment')) {
          return 'medical_devices';
        }
        if (collectionLower.includes('personal') || collectionLower.includes('hygiene')) {
          return 'personal_care';
        }
        // Default to over the counter
        return 'over_the_counter';
      };

      // Helper function to extract dosage from product name
      const extractDosage = (productName: string): string => {
        // Look for common dosage patterns like "100MG", "500mg", "2.5ML", etc.
        const dosageMatch = productName.match(/(\d+(?:\.\d+)?)\s?(mg|ml|g|mcg|iu|cc|%)/i);
        return dosageMatch ? dosageMatch[0] : 'N/A';
      };

      // Process each row
      for (const row of csvData) {
        try {
          const extrenalId = row['Extrenal ID'] || row['External_ID'] || row['External ID'];
          const productName = row['Product_Name'] || row['Product Name'];
          const price = row['Price'];
          const image = row['Image'];
          const description = row['Description'];
          const collection = row['Collection'] || row['SuperCollection'];

          // Skip if essential fields are missing
          if (!productName || !price) {
            results.skipped++;
            continue;
          }

          const inventoryItem = {
            medicationName: productName.trim(),
            dosage: extractDosage(productName),
            description: description?.trim() || '',
            category: mapCategory(collection),
            imageUrl: image || 'https://i.postimg.cc/s24h1HsW/pharma-1.png',
            isActive: true,
            requiresPrescription: false,
            currentStock: 100, // Default stock
            minimumStock: 10,
            unitPrice: cleanPrice(price),
            originalPrice: cleanPrice(price),
            supplier: 'Luton Hospital',
          };

          await storage.createInventoryItem(inventoryItem);
          results.imported++;

        } catch (error: any) {
          results.errors.push({
            row: row,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        message: `Import completed. ${results.imported} products imported, ${results.skipped} skipped.`,
        results
      });

    } catch (error) {
      console.error("Error importing products:", error);
      res.status(500).json({ message: "Failed to import products" });
    }
  });

  // Admin-specific routes for dashboard functionality
  app.get("/api/admin/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'pharmacist')) {
        return res.status(403).json({ message: "Access denied. Admin or pharmacist role required." });
      }

      // Use Promise.all for better performance
      const [
        pendingOrders,
        paidOrders,
        processingOrders,
        readyOrders,
        completedOrders,
        cancelledOrders,
        totalOrders,
        salesToday,
        salesWeek,
        salesMonth,
        paidRevenue,
        pendingRevenue,
        lowStockAlerts,
        newConsultations,
        totalProducts,
        activeUsers
      ] = await Promise.all([
        storage.getOrderCountByStatus('pending_payment'),
        storage.getOrderCountByStatus('paid'),
        storage.getOrderCountByStatus('processing'),
        storage.getOrderCountByStatus('ready'),
        storage.getOrderCountByStatus('completed'),
        storage.getOrderCountByStatus('cancelled'),
        storage.getTotalOrderCount(),
        storage.getSalesToday(),
        storage.getSalesThisWeek(),
        storage.getSalesThisMonth(),
        storage.getPaidRevenue(),
        storage.getPendingRevenue(),
        storage.getLowStockCount(),
        storage.getPendingConsultationCount(),
        storage.getTotalProductCount(),
        storage.getActiveUserCount()
      ]);

      const stats = {
        orders: {
          pending: pendingOrders,
          approved: paidOrders + processingOrders,
          fulfilled: readyOrders,
          delivered: completedOrders,
          cancelled: cancelledOrders,
          total: totalOrders
        },
        sales: {
          today: salesToday,
          week: salesWeek,
          month: salesMonth
        },
        revenue: {
          paid: paidRevenue,
          pending: pendingRevenue
        },
        lowStockAlerts,
        newConsultations,
        totalProducts,
        activeUsers
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  app.get("/api/admin/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'pharmacist')) {
        return res.status(403).json({ message: "Access denied. Admin or pharmacist role required." });
      }

      const orders = await storage.getAllOrdersWithDetails();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching admin orders:", error);
      res.status(500).json({ message: "Failed to fetch admin orders" });
    }
  });

  app.patch("/api/admin/orders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'pharmacist')) {
        return res.status(403).json({ message: "Access denied. Admin or pharmacist role required." });
      }

      const { id } = req.params;
      
      // Validate request body with Zod
      const validationResult = adminOrderUpdateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid request data",
          errors: validationResult.error.errors 
        });
      }

      const { status, notes } = validationResult.data;
      
      const order = await storage.updateOrderStatus(id, status, notes);
      res.json(order);
    } catch (error) {
      console.error("Error updating admin order:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  app.get("/api/admin/prescription-uploads", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'pharmacist')) {
        return res.status(403).json({ message: "Access denied. Admin or pharmacist role required." });
      }

      const uploads = await storage.getAllPrescriptionUploadsWithPatientDetails();
      res.json(uploads);
    } catch (error) {
      console.error("Error fetching admin prescription uploads:", error);
      res.status(500).json({ message: "Failed to fetch prescription uploads" });
    }
  });

  app.patch("/api/admin/prescription-uploads/:id/verify", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'pharmacist')) {
        return res.status(403).json({ message: "Access denied. Admin or pharmacist role required." });
      }

      const { id } = req.params;
      
      // Validate request body with Zod
      const validationResult = adminPrescriptionVerificationSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid request data",
          errors: validationResult.error.errors 
        });
      }

      const { action, notes, prescriptionData } = validationResult.data;
      
      let status = 'processed';
      if (action === 'approve') status = 'approved';
      else if (action === 'reject') status = 'rejected';
      else if (action === 'flag') status = 'flagged';
      
      const upload = await storage.updatePrescriptionUploadStatus(id, status, notes);
      res.json(upload);
    } catch (error) {
      console.error("Error verifying prescription upload:", error);
      res.status(500).json({ message: "Failed to verify prescription upload" });
    }
  });

  app.get("/api/admin/consultations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'pharmacist')) {
        return res.status(403).json({ message: "Access denied. Admin or pharmacist role required." });
      }

      const consultations = await storage.getAllConsultationsWithPatientDetails();
      res.json(consultations);
    } catch (error) {
      console.error("Error fetching admin consultations:", error);
      res.status(500).json({ message: "Failed to fetch consultations" });
    }
  });

  app.patch("/api/admin/consultations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'pharmacist')) {
        return res.status(403).json({ message: "Access denied. Admin or pharmacist role required." });
      }

      const { id } = req.params;
      
      // Validate request body with Zod
      const validationResult = adminConsultationUpdateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid request data",
          errors: validationResult.error.errors 
        });
      }

      const updates = validationResult.data;
      
      const consultation = await storage.updateConsultation(id, updates);
      res.json(consultation);
    } catch (error) {
      console.error("Error updating admin consultation:", error);
      res.status(500).json({ message: "Failed to update consultation" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
