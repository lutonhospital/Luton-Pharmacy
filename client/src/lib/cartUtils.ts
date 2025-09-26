import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

// Guest cart item structure for localStorage
export interface GuestCartItem {
  inventoryId: string;
  quantity: number;
  addedAt: string;
}

// Authenticated cart item from API (with product data)
export interface AuthenticatedCartItem {
  id: string;
  inventoryId: string;
  quantity: number;
  product?: {
    id: string;
    medicationName: string;
    dosage: string;
    unitPrice: string;
    currentStock: number;
    requiresPrescription: boolean;
  };
}

const GUEST_CART_KEY = "luton_hospital_guest_cart";

export class CartUtils {
  // Guest cart operations (localStorage)
  static getGuestCart(): GuestCartItem[] {
    try {
      const cartData = localStorage.getItem(GUEST_CART_KEY);
      return cartData ? JSON.parse(cartData) : [];
    } catch (error) {
      console.error("Error reading guest cart:", error);
      return [];
    }
  }

  static setGuestCart(cart: GuestCartItem[]): void {
    try {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error("Error saving guest cart:", error);
    }
  }

  static addToGuestCart(inventoryId: string, quantity: number = 1): void {
    const cart = this.getGuestCart();
    const existingItem = cart.find(item => item.inventoryId === inventoryId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({
        inventoryId,
        quantity,
        addedAt: new Date().toISOString(),
      });
    }

    this.setGuestCart(cart);
  }

  static updateGuestCartItem(inventoryId: string, quantity: number): void {
    const cart = this.getGuestCart();
    const item = cart.find(item => item.inventoryId === inventoryId);
    
    if (item) {
      if (quantity <= 0) {
        this.removeFromGuestCart(inventoryId);
      } else {
        item.quantity = quantity;
        this.setGuestCart(cart);
      }
    }
  }

  static removeFromGuestCart(inventoryId: string): void {
    const cart = this.getGuestCart();
    const filteredCart = cart.filter(item => item.inventoryId !== inventoryId);
    this.setGuestCart(filteredCart);
  }

  static clearGuestCart(): void {
    localStorage.removeItem(GUEST_CART_KEY);
  }

  static getGuestCartCount(): number {
    const cart = this.getGuestCart();
    return cart.reduce((total, item) => total + item.quantity, 0);
  }

  // Authenticated cart operations (API calls)
  static async getAuthenticatedCart(): Promise<AuthenticatedCartItem[]> {
    try {
      const response = await fetch("/api/cart");
      if (!response.ok) {
        throw new Error("Failed to fetch cart");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching authenticated cart:", error);
      return [];
    }
  }

  static async addToAuthenticatedCart(inventoryId: string, quantity: number = 1): Promise<void> {
    await apiRequest("POST", "/api/cart", { inventoryId, quantity });
  }

  static async updateAuthenticatedCartItem(itemId: string, quantity: number): Promise<void> {
    await apiRequest("PATCH", `/api/cart/${itemId}`, { quantity });
  }

  static async removeFromAuthenticatedCart(itemId: string): Promise<void> {
    await apiRequest("DELETE", `/api/cart/${itemId}`);
  }

  // Universal cart operations that work for both guest and authenticated users
  static async addToCart(user: User | null, inventoryId: string, quantity: number = 1): Promise<void> {
    if (user) {
      await this.addToAuthenticatedCart(inventoryId, quantity);
    } else {
      this.addToGuestCart(inventoryId, quantity);
    }
  }

  static getCartCount(user: User | null, authenticatedCart?: AuthenticatedCartItem[]): number {
    if (user && authenticatedCart) {
      return authenticatedCart.reduce((total, item) => total + item.quantity, 0);
    } else {
      return this.getGuestCartCount();
    }
  }

  // Merge guest cart with authenticated cart when user logs in
  static async mergeGuestCartOnLogin(): Promise<void> {
    const guestCart = this.getGuestCart();
    
    if (guestCart.length === 0) {
      return; // Nothing to merge
    }

    try {
      // Add all guest cart items to authenticated cart
      for (const item of guestCart) {
        await this.addToAuthenticatedCart(item.inventoryId, item.quantity);
      }
      
      // Clear guest cart after successful merge
      this.clearGuestCart();
    } catch (error) {
      console.error("Error merging guest cart:", error);
      // Keep guest cart if merge fails
    }
  }

  // Get enriched guest cart with product details
  static async getEnrichedGuestCart(): Promise<AuthenticatedCartItem[]> {
    const guestCart = this.getGuestCart();
    
    if (guestCart.length === 0) {
      return [];
    }

    try {
      // Fetch all products to get details for guest cart items
      const response = await fetch("/api/products");
      const products = await response.json();
      
      return guestCart.map(item => {
        const product = products.find((p: any) => p.id === item.inventoryId);
        return {
          id: `guest-${item.inventoryId}`, // Temporary ID for guest items
          inventoryId: item.inventoryId,
          quantity: item.quantity,
          product: product ? {
            id: product.id,
            medicationName: product.medicationName,
            dosage: product.dosage,
            unitPrice: product.unitPrice,
            currentStock: product.currentStock,
            requiresPrescription: product.requiresPrescription,
          } : undefined,
        };
      });
    } catch (error) {
      console.error("Error enriching guest cart:", error);
      return [];
    }
  }

  // Universal get cart method that works for both guest and authenticated users
  static async getCart(user: User | null): Promise<AuthenticatedCartItem[]> {
    if (user) {
      return await this.getAuthenticatedCart();
    } else {
      return await this.getEnrichedGuestCart();
    }
  }
}