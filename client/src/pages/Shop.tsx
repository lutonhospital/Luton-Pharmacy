import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ShoppingCart, Plus, Minus, Upload, Calendar, Filter, Grid, List, Star } from "lucide-react";
import { Link, useLocation } from "wouter";

interface Product {
  id: string;
  medicationName: string;
  dosage: string;
  description: string;
  category: string;
  imageUrl: string;
  unitPrice: string;
  originalPrice?: string;
  currentStock: number;
  requiresPrescription: boolean;
  rating?: number;
}

interface CartItem {
  id: string;
  inventoryId: string;
  quantity: number;
  product?: Product;
}

export default function Shop() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showCart, setShowCart] = useState(false);

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", { category: selectedCategory, search: searchQuery }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== "all") {
        params.append("category", selectedCategory);
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
    enabled: true,
  });

  // Fetch user's cart
  const { data: cartItems, isLoading: cartLoading } = useQuery<CartItem[]>({
    queryKey: ["/api/cart"],
    enabled: !!user,
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (data: { inventoryId: string; quantity: number }) => {
      const response = await apiRequest("POST", "/api/cart", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to Cart",
        description: "Item successfully added to your cart",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Please Login",
          description: "You need to login to add items to cart",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    },
  });

  // Update cart item mutation
  const updateCartMutation = useMutation({
    mutationFn: async (data: { id: string; quantity: number }) => {
      const response = await apiRequest("PATCH", `/api/cart/${data.id}`, { quantity: data.quantity });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "prescription_medicines", label: "Prescription Medicines" },
    { value: "over_the_counter", label: "Over the Counter" },
    { value: "vitamins_supplements", label: "Vitamins & Supplements" },
    { value: "first_aid", label: "First Aid" },
    { value: "baby_care", label: "Baby Care" },
    { value: "health_wellness", label: "Health & Wellness" },
    { value: "personal_care", label: "Personal Care" },
    { value: "medical_devices", label: "Medical Devices" },
  ];

  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.label || category;
  };

  const getCartItemCount = () => {
    return cartItems?.reduce((total, item) => total + item.quantity, 0) || 0;
  };

  const getTotalPrice = () => {
    return cartItems?.reduce((total, item) => {
      const price = parseFloat(item.product?.unitPrice || "0");
      return total + (price * item.quantity);
    }, 0) || 0;
  };

  const handleAddToCart = (product: Product) => {
    if (!user) {
      toast({
        title: "Please Login",
        description: "You need to login to add items to your cart",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation("/login");
      }, 1500);
      return;
    }

    addToCartMutation.mutate({
      inventoryId: product.id,
      quantity: 1,
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Luton Hospital Pharmacy Shop
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Your trusted pharmacy - prescription medicines, wellness products, and expert care
            </p>
            
            {/* Quick Actions */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Link href="/prescription-upload">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  data-testid="button-upload-prescription"
                >
                  <Upload className="h-4 w-4" />
                  Upload Prescription
                </Button>
              </Link>
              <Link href="/consultation">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  data-testid="button-book-consultation"
                >
                  <Calendar className="h-4 w-4" />
                  Book Consultation
                </Button>
              </Link>
              {user && (
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 relative"
                  onClick={() => setShowCart(!showCart)}
                  data-testid="button-view-cart"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Cart ({getCartItemCount()})
                  {getCartItemCount() > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                      {getCartItemCount()}
                    </Badge>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Search Products
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search medications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-products"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Category
                  </label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* View Mode */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    View Mode
                  </label>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      data-testid="button-grid-view"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      data-testid="button-list-view"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products Grid */}
          <div className="lg:w-3/4">
            {productsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-foreground">
                    Products
                    {selectedCategory && ` - ${getCategoryLabel(selectedCategory)}`}
                  </h2>
                  <p className="text-muted-foreground">
                    {products?.length || 0} products found
                  </p>
                </div>

                <div className={viewMode === "grid" ? 
                  "grid grid-cols-2 lg:grid-cols-4 gap-6" : 
                  "space-y-4"
                }>
                  {products?.map((product) => (
                    <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        {viewMode === "grid" ? (
                          <div className="space-y-4">
                            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                              {product.imageUrl ? (
                                <img 
                                  src={product.imageUrl} 
                                  alt={product.medicationName}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <div className="text-muted-foreground text-sm">No image</div>
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{product.medicationName}</h3>
                              <p className="text-sm text-muted-foreground">{product.dosage}</p>
                              <Badge variant="secondary" className="mt-1">
                                {getCategoryLabel(product.category)}
                              </Badge>
                              {product.requiresPrescription && (
                                <Badge variant="destructive" className="mt-1 ml-2">
                                  Prescription Required
                                </Badge>
                              )}
                              {/* Star Rating */}
                              <div className="flex items-center mt-2" data-testid={`rating-${product.id}`}>
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm text-muted-foreground ml-1" aria-label={`Rating: ${product.rating || 4.5} out of 5 stars`}>
                                  {product.rating || 4.5}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <p className="text-lg font-bold text-foreground">KES {parseFloat(product.unitPrice).toLocaleString()}</p>
                                {product.originalPrice && (
                                  <p className="text-sm text-muted-foreground line-through">
                                    KES {parseFloat(product.originalPrice).toLocaleString()}
                                  </p>
                                )}
                              </div>
                              <Button
                                onClick={() => handleAddToCart(product)}
                                disabled={addToCartMutation.isPending || product.currentStock === 0}
                                className="w-full"
                                data-testid={`button-add-to-cart-${product.id}`}
                              >
                                {product.currentStock === 0 ? "Out of Stock" : "Add to Cart"}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-4">
                            <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                              {product.imageUrl ? (
                                <img 
                                  src={product.imageUrl} 
                                  alt={product.medicationName}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <div className="text-muted-foreground text-xs">No image</div>
                              )}
                            </div>
                            <div className="flex-1 flex justify-between">
                              <div>
                                <h3 className="font-semibold text-foreground">{product.medicationName}</h3>
                                <p className="text-sm text-muted-foreground">{product.dosage}</p>
                                <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                                <div className="flex gap-2 mt-2">
                                  <Badge variant="secondary">
                                    {getCategoryLabel(product.category)}
                                  </Badge>
                                  {product.requiresPrescription && (
                                    <Badge variant="destructive">
                                      Prescription Required
                                    </Badge>
                                  )}
                                </div>
                                {/* Star Rating */}
                                <div className="flex items-center mt-2" data-testid={`rating-${product.id}`}>
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm text-muted-foreground ml-1" aria-label={`Rating: ${product.rating || 4.5} out of 5 stars`}>
                                    {product.rating || 4.5}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right min-w-[140px] flex flex-col justify-between">
                                <div>
                                  <p className="text-lg font-bold text-foreground">KES {parseFloat(product.unitPrice).toLocaleString()}</p>
                                  {product.originalPrice && (
                                    <p className="text-sm text-muted-foreground line-through">
                                      KES {parseFloat(product.originalPrice).toLocaleString()}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  className="mt-2 w-full"
                                  size="sm"
                                  onClick={() => handleAddToCart(product)}
                                  disabled={addToCartMutation.isPending || product.currentStock === 0}
                                  data-testid={`button-add-to-cart-${product.id}`}
                                >
                                  {product.currentStock === 0 ? "Out of Stock" : "Add to Cart"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {products?.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No products found matching your criteria.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Shopping Cart Sidebar */}
      {showCart && user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="fixed right-0 top-0 h-full w-96 bg-background border-l shadow-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Shopping Cart</h3>
                <Button variant="ghost" onClick={() => setShowCart(false)}>
                  ×
                </Button>
              </div>
              
              {cartLoading ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted rounded" />
                  ))}
                </div>
              ) : cartItems?.length ? (
                <>
                  <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex gap-3 p-3 border rounded">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium">{item.product?.medicationName}</h4>
                          <p className="text-xs text-muted-foreground">{item.product?.dosage}</p>
                          <p className="text-sm font-semibold">£{item.product?.unitPrice}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCartMutation.mutate({ 
                              id: item.id, 
                              quantity: Math.max(1, item.quantity - 1) 
                            })}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCartMutation.mutate({ 
                              id: item.id, 
                              quantity: item.quantity + 1 
                            })}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-semibold">Total: KES {getTotalPrice().toLocaleString()}</span>
                    </div>
                    <Button className="w-full" data-testid="button-checkout">
                      Proceed to Checkout
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-center py-8">Your cart is empty</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}