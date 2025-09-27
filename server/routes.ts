import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import multer from "multer";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { sendPrescriptionStatusEmail, sendOrderConfirmationEmail, sendPasswordResetEmail, sendAdminPasswordResetEmail } from "./emailService";
import { ObjectStorageService } from "./objectStorage";
import Stripe from "stripe";

// Admin authentication middleware for session-based authentication
const isAdminAuthenticated = (req: any, res: any, next: any) => {
  try {
    const adminUser = req.session?.adminUser;
    
    if (!adminUser || !adminUser.isAdmin) {
      return res.status(401).json({ message: "Admin authentication required" });
    }
    
    // Attach admin user to request for use in route handlers
    req.adminUser = adminUser;
    next();
  } catch (error) {
    console.error("Admin authentication middleware error:", error);
    res.status(500).json({ message: "Authentication check failed" });
  }
};
import { z } from "zod";
import { insertPrescriptionSchema, insertOrderSchema, insertAddressSchema, insertInventorySchema, insertPrescriptionUploadSchema, insertConsultationSchema, inventory, orders, prescriptions, users, consultations, passwordResetTokens } from "@shared/schema";

// Admin user management validation schemas
const createUserSchema = z.object({
  email: z.string().email(),
  tempPassword: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['patient', 'pharmacist', 'admin', 'super_admin']).default('pharmacist')
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  tempPassword: z.string().min(6).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['patient', 'pharmacist', 'admin', 'super_admin']).optional()
});
import { eq, and, like, desc, asc, count, sum, sql, inArray } from 'drizzle-orm';
import { db } from "./db";

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

// M-PESA and Cash payment configuration - no Stripe needed

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Helper function for payment amount validation
const validatePaymentAmount = (amountKes: number): boolean => {
  return amountKes > 0 && amountKes <= 100000; // Max 100,000 KES
};

// Unified authentication middleware for both session and OIDC
const isUserAuthenticated = async (req: any, res: any, next: any) => {
  try {
    // Check if user is authenticated via session first
    if (req.session && req.session.userId) {
      const user = await storage.getUser(req.session.userId);
      if (user) {
        // Attach user to request for session-based authentication
        req.sessionUser = user;
        return next();
      }
    }
    
    // Check if user is authenticated via OIDC (fallback for existing sessions)
    if (req.user && req.user.claims && req.user.claims.sub) {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user) {
        // Attach user to request for OIDC authentication
        req.sessionUser = user;
        return next();
      }
    }
    
    return res.status(401).json({ message: "Unauthorized" });
  } catch (error) {
    console.error("User authentication middleware error:", error);
    res.status(500).json({ message: "Authentication check failed" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // Check if user is authenticated via session
      if (req.session && req.session.userId) {
        const user = await storage.getUser(req.session.userId);
        if (user) {
          // Remove sensitive fields before sending to client
          const { password, ...userWithoutPassword } = user;
          res.json(userWithoutPassword);
          return;
        }
      }
      
      // Check if user is authenticated via OIDC (fallback for existing sessions)
      if (req.user && req.user.claims && req.user.claims.sub) {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        if (user) {
          // Remove sensitive fields before sending to client
          const { password, ...userWithoutPassword } = user;
          res.json(userWithoutPassword);
          return;
        }
      }
      
      res.status(401).json({ message: "Unauthorized" });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Email/Password authentication routes
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { email, password, firstName, lastName, phoneNumber } = req.body;

      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "Email, password, first name, and last name are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const userData = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        firstName,
        lastName,
        phone: phoneNumber || null, // Map phoneNumber to phone column
        password: hashedPassword,
        role: 'patient' as const,
      };

      const user = await storage.upsertUser(userData);

      // Create session
      (req as any).session.userId = user.id;
      (req as any).session.userEmail = user.email;

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({ 
        message: "Account created successfully", 
        user: userWithoutPassword 
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Create session
      (req as any).session.userId = user.id;
      (req as any).session.userEmail = user.email;

      // Save session explicitly
      (req as any).session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Session creation failed" });
        }
        
        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        res.json({ 
          message: "Login successful", 
          user: userWithoutPassword 
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post('/api/auth/logout', async (req, res) => {
    try {
      if ((req as any).session) {
        (req as any).session.destroy((err: any) => {
          if (err) {
            console.error("Session destruction error:", err);
            return res.status(500).json({ message: "Failed to logout" });
          }
          res.json({ message: "Logout successful" });
        });
      } else {
        res.json({ message: "Logout successful" });
      }
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      // Clean up expired tokens for security and database hygiene
      await storage.cleanupExpiredTokens();
      
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Return success even if user doesn't exist (security best practice)
        return res.json({ message: "If an account with that email exists, a password reset link has been sent." });
      }

      // Generate secure reset token
      const crypto = await import('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Hash the token before storing (security: store only hash, not plaintext)
      const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      
      // Token expires in 1 hour
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      // Clean up any existing tokens for this email and user type
      await storage.cleanupUserPasswordResetTokens(email, 'user');

      // Store hashed token in database
      await storage.createPasswordResetToken({
        email,
        token: tokenHash,
        userType: 'user',
        expiresAt,
      });

      // Send password reset email with secure URL construction
      const baseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:5000';
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
      
      const emailSent = await sendPasswordResetEmail(email, user.firstName || 'User', resetUrl);
      
      if (emailSent) {
        console.log(`Password reset email sent to: ${email}`);
      } else {
        console.log(`Password reset email failed to send to: ${email}`);
      }
      
      // Development-only: Log raw token for testing (never do this in production)
      if (process.env.NODE_ENV === 'development') {
        console.log(`DEV: Password reset token for ${email}: ${resetToken}`);
      }
      
      res.json({ 
        message: "If an account with that email exists, a password reset link has been sent."
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  // Handle password reset (consume token)
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, password } = req.body;

      console.log(`Reset password attempt - Token length: ${token?.length}, Password provided: ${!!password}`);

      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }

      // Validate and get reset token
      const resetToken = await storage.getPasswordResetToken(token);
      
      console.log(`Reset token lookup result: ${resetToken ? 'Found' : 'Not found'}`);
      
      if (!resetToken || resetToken.userType !== 'user') {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Find the user by email
      const user = await storage.getUserByEmail(resetToken.email);
      
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Update user password
      await storage.updateUser(user.id, { password: hashedPassword });

      // Mark token as used
      await storage.markPasswordResetTokenUsed(token);

      res.json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
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

      // First try to find admin user in database
      let adminUser = await storage.getUserByEmail(username);
      
      // Development-only hardcoded admin fallback (NEVER in production)
      if (!adminUser && username === "admin" && process.env.NODE_ENV === 'development') {
        // Check hardcoded credentials as development fallback only
        const validPassword = "luton123";
        if (password === validPassword) {
          console.log('WARNING: Using hardcoded admin credentials (development only)');
          // Create session for hardcoded admin
          (req as any).session.adminUser = {
            id: 'admin',
            username: username,
            role: 'super_admin',
            isAdmin: true,
            loginTime: new Date()
          };

          return res.json({ 
            message: "Login successful",
            user: {
              id: 'admin',
              username: username,
              role: 'super_admin',
              firstName: 'Admin',
              lastName: 'User'
            }
          });
        }
      }
      
      // If no database user found, login fails
      if (!adminUser) {
        console.log('Admin login failed: Admin user not found');
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Check if user has admin role (only admin and super_admin get full access)
      if (!['admin', 'super_admin'].includes(adminUser.role || '')) {
        console.log('Admin login failed: User is not an admin');
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Verify password against database
      if (!adminUser.password) {
        console.log('Admin login failed: No password set for database user');
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      const isValidPassword = await bcrypt.compare(password, adminUser.password);
      if (!isValidPassword) {
        console.log('Admin login failed: Invalid password for database user');
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Create admin session for database user
      (req as any).session.adminUser = {
        id: adminUser.id,
        username: adminUser.email,
        role: adminUser.role,
        isAdmin: true,
        loginTime: new Date()
      };

      res.json({ 
        message: "Login successful",
        user: {
          id: adminUser.id,
          username: adminUser.email,
          role: adminUser.role,
          firstName: adminUser.firstName || 'Admin',
          lastName: adminUser.lastName || 'User'
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

  app.post('/api/admin/forgot-password', async (req, res) => {
    try {
      // Clean up expired tokens for security and database hygiene
      await storage.cleanupExpiredTokens();
      
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check if admin user exists with admin role
      const user = await storage.getUserByEmail(email);
      
      if (!user || !['admin', 'super_admin'].includes(user.role || '')) {
        // Return success even if admin doesn't exist (security best practice)
        return res.json({ message: "If an admin account with that email exists, a password reset link has been sent." });
      }

      // Generate secure reset token
      const crypto = await import('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Hash the token before storing (security: store only hash, not plaintext)
      const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      
      // Token expires in 1 hour
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      // Clean up any existing tokens for this email and user type
      await storage.cleanupUserPasswordResetTokens(email, 'admin');

      // Store hashed token in database
      await storage.createPasswordResetToken({
        email,
        token: tokenHash,
        userType: 'admin',
        expiresAt,
      });

      // Send admin password reset email with secure URL construction
      const baseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:5000';
      const resetUrl = `${baseUrl}/admin/reset-password?token=${resetToken}`;
      
      const emailSent = await sendAdminPasswordResetEmail(email, user.firstName || 'Admin', resetUrl);
      
      if (emailSent) {
        console.log(`Admin password reset email sent to: ${email}`);
      } else {
        console.log(`Admin password reset email failed to send to: ${email}`);
      }
      
      // Development-only: Log raw token for testing (never do this in production)
      if (process.env.NODE_ENV === 'development') {
        console.log(`DEV: Admin password reset token for ${email}: ${resetToken}`);
      }
      
      res.json({ 
        message: "If an admin account with that email exists, a password reset link has been sent."
      });
    } catch (error) {
      console.error("Admin forgot password error:", error);
      res.status(500).json({ message: "Failed to process admin password reset request" });
    }
  });

  // Handle admin password reset (consume token)
  app.post('/api/admin/reset-password', async (req, res) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Admin password must be at least 8 characters long" });
      }

      // Validate and get reset token
      const resetToken = await storage.getPasswordResetToken(token);
      
      if (!resetToken || resetToken.userType !== 'admin') {
        return res.status(400).json({ message: "Invalid or expired admin reset token" });
      }

      // Find the admin user by email
      const user = await storage.getUserByEmail(resetToken.email);
      
      if (!user || !['admin', 'super_admin'].includes(user.role || '')) {
        return res.status(400).json({ message: "Admin user not found" });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Update admin password
      await storage.updateUser(user.id, { password: hashedPassword });

      // Mark token as used
      await storage.markPasswordResetTokenUsed(token);

      console.log(`Admin password reset completed for: ${resetToken.email}`);

      res.json({ message: "Admin password reset successful" });
    } catch (error) {
      console.error("Admin reset password error:", error);
      res.status(500).json({ message: "Failed to reset admin password" });
    }
  });

  // Development-only endpoint to get raw token for testing
  if (process.env.NODE_ENV === 'development') {
    app.get('/api/dev/password-reset-token/:email', async (req, res) => {
      try {
        const { email } = req.params;
        
        // Get the latest password reset token for this email
        const tokenRecord = await storage.getPasswordResetToken(token);
        
        if (!tokenRecord) {
          return res.status(404).json({ message: "No reset token found for this email" });
        }
        
        // In development, we need to provide a way to test the actual flow
        // Since the stored token is hashed, we can't reverse it
        // But we can create a test token that matches the stored hash
        res.json({ 
          message: "Token found but hashed in database",
          tokenId: tokenRecord.id,
          email: tokenRecord.email,
          userType: tokenRecord.userType,
          expiresAt: tokenRecord.expiresAt,
          note: "In production, raw token would be sent via email"
        });
      } catch (error) {
        console.error("Dev token lookup error:", error);
        res.status(500).json({ message: "Failed to lookup token" });
      }
    });
  }

  // Admin dashboard stats
  app.get('/api/admin/stats', async (req, res) => {
    try {
      const adminUser = (req as any).session?.adminUser;
      
      if (!adminUser || !adminUser.isAdmin) {
        return res.status(401).json({ message: "Not authenticated as admin" });
      }

      // Get comprehensive admin dashboard stats
      const [
        totalProducts,
        totalOrders,
        pendingOrders,
        approvedOrders,
        fulfilledOrders,
        deliveredOrders,
        cancelledOrders,
        pendingPrescriptions,
        totalRevenue,
        pendingRevenue,
        activeUsers,
        todaySales,
        weekSales,
        monthSales,
        newConsultations,
        lowStockItems
      ] = await Promise.all([
        db.select({ count: count() }).from(inventory),
        db.select({ count: count() }).from(orders),
        db.select({ count: count() }).from(orders).where(eq(orders.status, "pending_payment")),
        db.select({ count: count() }).from(orders).where(eq(orders.status, "processing")),
        db.select({ count: count() }).from(orders).where(eq(orders.status, "ready")),
        db.select({ count: count() }).from(orders).where(eq(orders.status, "completed")),
        db.select({ count: count() }).from(orders).where(eq(orders.status, "cancelled")),
        db.select({ count: count() }).from(prescriptions).where(eq(prescriptions.status, "pending_review")),
        db.select({ sum: sum(orders.totalAmount) }).from(orders).where(eq(orders.status, "completed")),
        db.select({ sum: sum(orders.totalAmount) }).from(orders).where(inArray(orders.status, ["pending_payment", "paid", "processing", "ready"])),
        db.select({ count: count() }).from(users),
        db.select({ sum: sum(orders.totalAmount) }).from(orders).where(
          and(
            eq(orders.status, "completed"),
            sql`DATE(${orders.createdAt}) = CURRENT_DATE`
          )
        ),
        db.select({ sum: sum(orders.totalAmount) }).from(orders).where(
          and(
            eq(orders.status, "completed"),
            sql`${orders.createdAt} >= CURRENT_DATE - INTERVAL '7 days'`
          )
        ),
        db.select({ sum: sum(orders.totalAmount) }).from(orders).where(
          and(
            eq(orders.status, "completed"),
            sql`${orders.createdAt} >= CURRENT_DATE - INTERVAL '30 days'`
          )
        ),
        db.select({ count: count() }).from(consultations).where(eq(consultations.status, "scheduled")),
        storage.getLowStockItems()
      ]);

      const stats = {
        orders: {
          pending: pendingOrders[0]?.count || 0,
          approved: approvedOrders[0]?.count || 0,
          fulfilled: fulfilledOrders[0]?.count || 0,
          delivered: deliveredOrders[0]?.count || 0,
          cancelled: cancelledOrders[0]?.count || 0,
          total: totalOrders[0]?.count || 0,
        },
        sales: {
          today: todaySales[0]?.sum || 0,
          week: weekSales[0]?.sum || 0,
          month: monthSales[0]?.sum || 0,
        },
        revenue: {
          paid: totalRevenue[0]?.sum || 0,
          pending: pendingRevenue[0]?.sum || 0,
        },
        lowStockAlerts: lowStockItems.length,
        newConsultations: newConsultations[0]?.count || 0,
        totalProducts: totalProducts[0]?.count || 0,
        activeUsers: activeUsers[0]?.count || 0,
      };

      res.json(stats);
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
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

  app.post('/api/prescription-uploads', async (req: any, res) => {
    try {
      // Check if user is authenticated
      const isAuthenticated = req.user && req.user.claims && req.user.claims.sub;
      let userId = null;
      
      if (isAuthenticated) {
        userId = req.user.claims.sub;
      } else {
        // For guests, create a temporary identifier
        userId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      
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
  app.get('/api/orders', isUserAuthenticated, async (req: any, res) => {
    try {
      const userId = req.sessionUser.id;
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

  app.get('/api/orders/:id', isUserAuthenticated, async (req: any, res) => {
    try {
      const userId = req.sessionUser.id;
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

  app.post('/api/orders', isUserAuthenticated, async (req: any, res) => {
    try {
      const userId = req.sessionUser.id;
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

  // Payment completion routes for M-PESA and Cash
  app.post("/api/complete-order", isUserAuthenticated, async (req: any, res) => {
    try {
      const { orderId, paymentMethod, mpesaReceiptNumber } = req.body;
      const userId = req.sessionUser.id;
      
      if (!orderId || !paymentMethod) {
        return res.status(400).json({ message: "Order ID and payment method are required" });
      }

      // Validate payment method
      if (!['cash', 'mpesa'].includes(paymentMethod)) {
        return res.status(400).json({ message: "Invalid payment method. Only cash and M-PESA are supported." });
      }

      // For M-PESA, receipt number is required
      if (paymentMethod === 'mpesa' && !mpesaReceiptNumber) {
        return res.status(400).json({ message: "M-PESA receipt number is required" });
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

      // Validate payment amount
      if (!validatePaymentAmount(parseFloat(order.totalAmount))) {
        return res.status(400).json({ message: "Invalid payment amount" });
      }

      // Update order with payment info
      const updateData: any = {
        paymentMethod,
        status: paymentMethod === 'cash' ? 'pending_payment' : 'paid' // Cash orders remain pending until physically paid
      };

      if (paymentMethod === 'mpesa') {
        updateData.mpesaReceiptNumber = mpesaReceiptNumber;
      }

      const updatedOrder = await storage.updateOrderWithPaymentInfo(orderId, paymentMethod, mpesaReceiptNumber);
      
      // Get order items for email
      const orderItems = await storage.getOrderItems(orderId);
      
      // Send confirmation email
      if (user?.email) {
        const items = orderItems.map(item => ({
          medicationName: item.medicationName,
          quantity: item.quantity,
          price: item.totalPrice,
        }));
        
        await sendOrderConfirmationEmail(
          user.email,
          `${user.firstName} ${user.lastName}`,
          updatedOrder.orderNumber,
          updatedOrder.totalAmount,
          items
        );
      }
      
      res.json({ 
        success: true, 
        order: updatedOrder,
        message: paymentMethod === 'cash' 
          ? 'Order confirmed. Please pay in cash when you collect your order.'
          : 'Order confirmed. M-PESA payment verified.'
      });
    } catch (error: any) {
      console.error("Error completing order:", error);
      res.status(500).json({ message: "Error completing order: " + error.message });
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

  // Get single product by ID for product detail page
  app.get("/api/product/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const product = await storage.getInventoryById(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (!product.isActive) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Shopping cart routes
  app.get("/api/cart", isUserAuthenticated, async (req: any, res) => {
    try {
      const userId = req.sessionUser.id;
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

  app.post("/api/cart", isUserAuthenticated, async (req: any, res) => {
    try {
      const userId = req.sessionUser.id;
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

  app.patch("/api/cart/:id", isUserAuthenticated, async (req: any, res) => {
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

  app.delete("/api/cart/:id", isUserAuthenticated, async (req: any, res) => {
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
  app.get("/api/admin/products", isAdminAuthenticated, async (req: any, res) => {
    try {
      const products = await storage.getAllInventory();
      res.json(products);
    } catch (error) {
      console.error("Error fetching admin products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post("/api/admin/products", isAdminAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertInventorySchema.parse(req.body);
      const product = await storage.createInventoryItem(validatedData);
      res.json(product);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.patch("/api/admin/products/:id", isAdminAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertInventorySchema.partial().parse(req.body);
      const product = await storage.updateInventoryItem(id, validatedData);
      res.json(product);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/admin/products/:id", isAdminAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteInventoryItem(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Image upload route for admin
  app.post("/api/admin/upload-image", isAdminAuthenticated, upload.single('image'), async (req: any, res) => {
    try {

      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      // Additional security: verify file is actually an image
      const buffer = req.file.buffer;
      const isValidImage = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF || // JPEG
                          buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 || // PNG
                          buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46; // GIF

      if (!isValidImage) {
        return res.status(400).json({ message: "Invalid image format. Only JPEG, PNG, and GIF are allowed." });
      }

      // Generate secure filename with UUID
      const fileExtension = req.file.mimetype.split('/')[1] || 'jpg';
      const secureFilename = `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;

      const objectStorageService = new ObjectStorageService();
      const imageUrl = await objectStorageService.uploadToPublicDir(
        req.file.buffer,
        secureFilename,
        req.file.mimetype
      );

      res.json({ imageUrl });
    } catch (error) {
      console.error("Error uploading image:", error);
      if (error instanceof Error && error.message.includes('Only image files are allowed')) {
        return res.status(400).json({ message: "Only image files are allowed" });
      }
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Route to serve public images
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Super Admin User Management Routes
  
  // Get all users (super admin only)
  app.get("/api/admin/users", isAdminAuthenticated, async (req: any, res) => {
    try {
      const adminUser = req.adminUser;
      if (!adminUser || adminUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Super admin access required" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Create new user (super admin only)
  app.post("/api/admin/users", isAdminAuthenticated, async (req: any, res) => {
    try {
      const adminUser = req.adminUser;
      if (!adminUser || adminUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Super admin access required" });
      }

      // Validate request body
      const validationResult = createUserSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid input data", 
          errors: validationResult.error.errors 
        });
      }

      const { email, firstName, lastName, role, tempPassword } = validationResult.data;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Hash password before storing
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(tempPassword, 12);

      const newUser = await storage.createUser({
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        role: role || 'pharmacist'
      });

      // Remove password from response
      const { password: _, ...userResponse } = newUser;
      res.json(userResponse);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Update user (super admin only)
  app.patch("/api/admin/users/:id", isAdminAuthenticated, async (req: any, res) => {
    try {
      const adminUser = req.adminUser;
      if (!adminUser || adminUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Super admin access required" });
      }

      const { id } = req.params;
      
      // Validate request body
      const validationResult = updateUserSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid input data", 
          errors: validationResult.error.errors 
        });
      }

      const { email, firstName, lastName, role, tempPassword } = validationResult.data;

      const updateData: any = {
        email,
        firstName,
        lastName,
        role
      };

      // Hash password if provided
      if (tempPassword) {
        const bcrypt = await import('bcryptjs');
        updateData.password = await bcrypt.hash(tempPassword, 12);
      }

      const updatedUser = await storage.updateUser(id, updateData);

      // Remove password from response
      const { password: _, ...userResponse } = updatedUser;
      res.json(userResponse);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Delete user (super admin only)
  app.delete("/api/admin/users/:id", isAdminAuthenticated, async (req: any, res) => {
    try {
      const adminUser = req.adminUser;
      if (!adminUser || adminUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Super admin access required" });
      }

      const { id } = req.params;
      
      // Prevent self-deletion
      if (id === adminUser.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      await storage.deleteUser(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // CSV Import endpoint for pharmaceutical products
  app.post("/api/admin/import-products", isAdminAuthenticated, async (req: any, res) => {
    try {
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
          const extrenalId = row[' Extrenal ID'] || row['Extrenal ID'] || row['External_ID'] || row['External ID'];
          const productName = row['Product_Name'] || row['Product Name'];
          const price = row['Price'];
          const image = row['Image'];
          const description = row['Description'] || '';
          const collection = row['Collection'] || row['SuperCollection'];

          // Skip if essential fields are missing or price is 0
          if (!productName || !price || cleanPrice(price) === 0) {
            results.skipped++;
            continue;
          }

          const inventoryItem = {
            medicationName: productName.trim(),
            dosage: extractDosage(productName),
            description: description?.trim() || `${productName.trim()} - Quality pharmaceutical product from Luton Hospital`,
            category: mapCategory(collection),
            imageUrl: image || 'https://i.postimg.cc/s24h1HsW/pharma-1.png',
            isActive: true,
            requiresPrescription: false,
            currentStock: 50, // Default stock for imported products
            minimumStock: 10,
            unitPrice: cleanPrice(price).toString(),
            originalPrice: cleanPrice(price).toString(),
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
  app.get("/api/admin/stats", isAdminAuthenticated, async (req: any, res) => {
    try {

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
