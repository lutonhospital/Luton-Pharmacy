import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ShoppingCart, Plus, Minus, Trash2, CreditCard, Smartphone } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CartUtils } from "@/lib/cartUtils";

export default function Cart() {
  const { user, isAuthenticated } = useAuth();
  const { cartItems, cartCount, cartTotal, isLoading } = useCart();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Update cart item mutation for authenticated users
  const updateCartMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const response = await apiRequest("PATCH", `/api/cart/${id}`, { quantity });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Cart Updated",
        description: "Item quantity updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update cart item",
        variant: "destructive",
      });
    },
  });

  // Remove cart item mutation for authenticated users
  const removeFromCartMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/cart/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Item Removed",
        description: "Item removed from cart successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove item from cart",
        variant: "destructive",
      });
    },
  });

  // Guest cart operations
  const handleGuestCartUpdate = (inventoryId: string, quantity: number) => {
    CartUtils.updateGuestCartItem(inventoryId, quantity);
    queryClient.invalidateQueries({ queryKey: ["guestCart"] });
    window.dispatchEvent(new CustomEvent('guestCartUpdated'));
    toast({
      title: "Cart Updated",
      description: "Item quantity updated successfully",
    });
  };

  const handleGuestCartRemove = (inventoryId: string) => {
    CartUtils.removeFromGuestCart(inventoryId);
    queryClient.invalidateQueries({ queryKey: ["guestCart"] });
    window.dispatchEvent(new CustomEvent('guestCartUpdated'));
    toast({
      title: "Item Removed",
      description: "Item removed from cart successfully",
    });
  };

  const displayItems = cartItems;
  const displayTotal = cartTotal;
  const displayCount = cartCount;

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const orderData = {
        totalAmount: (displayTotal + 200).toFixed(2), // Subtotal + delivery fee
        deliveryMethod: "delivery", // Default to delivery
        paymentMethod: "mpesa", // Default to M-PESA payment (user can change on payment page)
      };
      const response = await apiRequest("POST", "/api/orders", orderData);
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to payment page with order ID
      setLocation(`/payment/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCheckout = () => {
    if (!isAuthenticated) {
      // Redirect to login with cart context
      setLocation('/login?redirect=cart&action=checkout');
      return;
    }
    
    if (displayCount === 0) {
      toast({
        title: "Empty Cart",
        description: "Add items to your cart before checkout",
        variant: "destructive",
      });
      return;
    }
    
    // Create order first, then redirect to payment page
    createOrderMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <ShoppingCart className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Shopping Cart</h1>
            <p className="text-xl text-gray-600">
              Review your items and proceed to checkout
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          
          {displayCount === 0 ? (
            /* Empty Cart */
            <Card>
              <CardContent className="text-center py-12">
                <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Your cart is empty</h3>
                <p className="text-gray-600 mb-6">
                  Start shopping to add items to your cart
                </p>
                <Link href="/shop">
                  <Button data-testid="button-start-shopping">
                    Start Shopping
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            /* Cart with Items - Both Authenticated and Guest Users */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Cart Items ({displayCount} item{displayCount !== 1 ? 's' : ''})
                </h2>
                
                {displayItems.map((item, index) => (
                  <Card key={item.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {item.product?.medicationName}
                          </h3>
                          <p className="text-sm text-gray-600">{item.product?.dosage}</p>
                          {item.product?.requiresPrescription && (
                            <Badge variant="destructive" className="mt-2">
                              Prescription Required
                            </Badge>
                          )}
                          <p className="text-lg font-bold text-primary mt-2">
                            KES {item.product?.unitPrice}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          {/* Quantity Controls */}
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (isAuthenticated) {
                                  updateCartMutation.mutate({ 
                                    id: item.id, 
                                    quantity: Math.max(1, item.quantity - 1) 
                                  });
                                } else {
                                  handleGuestCartUpdate(item.inventoryId, Math.max(1, item.quantity - 1));
                                }
                              }}
                              data-testid={`button-decrease-quantity-${index}`}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="text-lg font-semibold w-12 text-center" data-testid={`quantity-${index}`}>
                              {item.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (isAuthenticated) {
                                  updateCartMutation.mutate({ 
                                    id: item.id, 
                                    quantity: item.quantity + 1 
                                  });
                                } else {
                                  handleGuestCartUpdate(item.inventoryId, item.quantity + 1);
                                }
                              }}
                              data-testid={`button-increase-quantity-${index}`}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {/* Remove Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (isAuthenticated) {
                                removeFromCartMutation.mutate(item.id);
                              } else {
                                handleGuestCartRemove(item.inventoryId);
                              }
                            }}
                            data-testid={`button-remove-${index}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Item Total */}
                      <div className="flex justify-between items-center mt-4 pt-4 border-t">
                        <span className="text-sm text-gray-600">Item Total:</span>
                        <span className="text-lg font-bold text-gray-800">
                          KES {(parseFloat(item.product?.unitPrice || "0") * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="sticky top-8">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal ({displayCount} items):</span>
                      <span>KES {displayTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Delivery Fee:</span>
                      <span>KES 200.00</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>KES {(displayTotal + 200).toFixed(2)}</span>
                    </div>
                    
                    {!isAuthenticated && (
                      <div className="bg-blue-50 p-4 rounded-lg mb-4">
                        <p className="text-sm text-blue-800">
                          You'll need to login or sign up to complete checkout
                        </p>
                      </div>
                    )}
                    
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90" 
                      onClick={handleCheckout}
                      disabled={createOrderMutation.isPending}
                      data-testid="button-checkout"
                    >
                      <Smartphone className="h-4 w-4 mr-2" />
                      {createOrderMutation.isPending ? 'Creating Order...' : 
                       isAuthenticated ? 'Proceed to Payment' : 
                       'Login to Checkout'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          
          <div className="mt-8">
            <Link href="/shop">
              <Button variant="outline" className="flex items-center gap-2" data-testid="button-continue-shopping">
                <ArrowLeft className="h-4 w-4" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}