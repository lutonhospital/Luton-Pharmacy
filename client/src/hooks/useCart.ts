import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { CartUtils } from "@/lib/cartUtils";
import type { User } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

export interface CartItem {
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

export function useCart() {
  const { user, isAuthenticated } = useAuth();
  const [guestCartCount, setGuestCartCount] = useState(0);
  const [hasMergedOnLogin, setHasMergedOnLogin] = useState(false);

  // Query for authenticated cart
  const { data: authenticatedCart, isLoading: authenticatedCartLoading } = useQuery<CartItem[]>({
    queryKey: ["/api/cart"],
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
  });

  // Update guest cart count when guest cart changes
  useEffect(() => {
    const updateGuestCartCount = () => {
      if (!isAuthenticated) {
        setGuestCartCount(CartUtils.getGuestCartCount());
      }
    };

    updateGuestCartCount();
    
    // Listen for guest cart updates
    window.addEventListener('guestCartUpdated', updateGuestCartCount);
    
    return () => {
      window.removeEventListener('guestCartUpdated', updateGuestCartCount);
    };
  }, [isAuthenticated]);

  // Merge guest cart when user logs in
  useEffect(() => {
    const mergeCartOnLogin = async () => {
      if (isAuthenticated && user && !hasMergedOnLogin) {
        const guestCart = CartUtils.getGuestCart();
        
        if (guestCart.length > 0) {
          try {
            await CartUtils.mergeGuestCartOnLogin();
            // Refresh authenticated cart after merge
            queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
            setGuestCartCount(0);
          } catch (error) {
            console.error("Failed to merge guest cart:", error);
          }
        }
        
        setHasMergedOnLogin(true);
      }
    };

    mergeCartOnLogin();
  }, [isAuthenticated, user, hasMergedOnLogin]);

  // Reset merge flag when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setHasMergedOnLogin(false);
      setGuestCartCount(CartUtils.getGuestCartCount());
    }
  }, [isAuthenticated]);

  // Calculate total cart count
  const cartCount = isAuthenticated
    ? (authenticatedCart?.reduce((total, item) => total + item.quantity, 0) || 0)
    : guestCartCount;

  // Calculate total cart price
  const cartTotal = isAuthenticated
    ? (authenticatedCart?.reduce((total, item) => {
        const price = parseFloat(item.product?.unitPrice || "0");
        return total + (price * item.quantity);
      }, 0) || 0)
    : 0; // For guest cart, we'd need to fetch product prices

  const cartItems = isAuthenticated ? authenticatedCart || [] : [];

  return {
    cartItems,
    cartCount,
    cartTotal,
    isLoading: isAuthenticated ? authenticatedCartLoading : false,
    isAuthenticated,
    user,
  };
}