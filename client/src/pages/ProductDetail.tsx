import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CartUtils } from "@/lib/cartUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShoppingCart, 
  Heart,
  Star,
  Shield,
  Truck,
  Clock,
  Package,
  AlertTriangle,
  Check,
  Info,
  Calendar,
  Building,
  Minus,
  Plus
} from "lucide-react";
import { Link, useParams } from "wouter";

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
  minimumStock: number;
  requiresPrescription: boolean;
  supplier?: string;
  expiryDate?: string;
  isActive: boolean;
}

interface CartItem {
  id: string;
  inventoryId: string;
  quantity: number;
  product?: Product;
}

export default function ProductDetail() {
  const { id } = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [selectedTab, setSelectedTab] = useState("details");

  // Fetch product details
  const { data: product, isLoading: productLoading, error } = useQuery<Product>({
    queryKey: ["/api/product", id],
    queryFn: async () => {
      const response = await fetch(`/api/product/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Product not found");
        }
        throw new Error("Failed to fetch product");
      }
      return response.json();
    },
    enabled: !!id,
  });

  // Fetch user's cart
  const { data: cartItems } = useQuery<CartItem[]>({
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
        title: "Added to cart",
        description: `${quantity} × ${product?.medicationName} added to your cart`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add item to cart",
        variant: "destructive",
      });
    },
  });

  // Update document title and meta for SEO
  useEffect(() => {
    if (product) {
      document.title = `${product.medicationName} ${product.dosage} - KES ${product.unitPrice} | Luton Hospital Pharmacy`;
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', 
          `Buy ${product.medicationName} ${product.dosage} online at Luton Hospital Pharmacy. ${product.description || ''} Price: KES ${product.unitPrice}. ${product.requiresPrescription ? 'Prescription required.' : 'Available over the counter.'}`
        );
      }
    }
  }, [product]);

  const handleAddToCart = () => {
    if (!product) return;

    if (user) {
      // User is logged in, use authenticated cart
      addToCartMutation.mutate({
        inventoryId: product.id,
        quantity,
      });
    } else {
      // Guest user, use local storage cart
      CartUtils.addToGuestCart(product.id, quantity);
      queryClient.invalidateQueries({ queryKey: ['guest-cart'] });
      toast({
        title: "Added to cart",
        description: `${quantity} × ${product.medicationName} added to your cart`,
      });
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= (product?.currentStock || 1)) {
      setQuantity(newQuantity);
    }
  };

  const formatCategory = (category: string) => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatExpiryDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStockStatus = () => {
    if (!product) return { status: 'unknown', color: 'gray' };
    
    if (product.currentStock === 0) {
      return { status: 'Out of Stock', color: 'red' };
    } else if (product.currentStock <= product.minimumStock) {
      return { status: 'Low Stock', color: 'orange' };
    } else {
      return { status: 'In Stock', color: 'green' };
    }
  };

  const stockStatus = getStockStatus();
  const discount = product?.originalPrice ? 
    Math.round((1 - parseFloat(product.unitPrice) / parseFloat(product.originalPrice)) * 100) : 0;

  if (productLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-200 aspect-square rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-8">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The product you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/shop">
              <Button>Browse Products</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-primary">Shop</Link>
        <span>/</span>
        <span className="text-foreground">{product.medicationName}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Product Image */}
        <div className="space-y-4">
          <div className="aspect-square rounded-lg border bg-card overflow-hidden">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={`${product.medicationName} ${product.dosage}`}
                className="w-full h-full object-cover"
                data-testid={`img-product-${product.id}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <Package className="h-24 w-24 text-muted-foreground" />
              </div>
            )}
          </div>
          
          {/* Trust Badges */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 text-sm">
              <Shield className="h-4 w-4 text-green-600" />
              <span>Licensed Pharmacy</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Truck className="h-4 w-4 text-green-600" />
              <span>Same Day Delivery</span>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" data-testid={`badge-category-${product.id}`}>
                {formatCategory(product.category)}
              </Badge>
              {product.requiresPrescription && (
                <Badge variant="outline" className="border-red-200 text-red-800">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Prescription Required
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2" data-testid={`title-product-${product.id}`}>
              {product.medicationName}
            </h1>
            <p className="text-lg text-muted-foreground" data-testid={`dosage-product-${product.id}`}>
              {product.dosage}
            </p>
          </div>

          {/* Pricing */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-primary" data-testid={`price-product-${product.id}`}>
                KES {product.unitPrice}
              </span>
              {product.originalPrice && (
                <>
                  <span className="text-xl text-muted-foreground line-through">
                    KES {product.originalPrice}
                  </span>
                  <Badge variant="destructive" className="bg-red-600">
                    {discount}% OFF
                  </Badge>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Price inclusive of all taxes</p>
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full bg-${stockStatus.color}-500`}></div>
            <span className={`text-${stockStatus.color}-600 font-medium`} data-testid={`stock-status-${product.id}`}>
              {stockStatus.status}
            </span>
            {product.currentStock > 0 && (
              <span className="text-muted-foreground">
                ({product.currentStock} units available)
              </span>
            )}
          </div>

          {/* Quantity Selector */}
          {product.currentStock > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border rounded-md">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    data-testid="button-decrease-quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-4 py-2 min-w-[60px] text-center" data-testid="text-quantity">
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= product.currentStock}
                    data-testid="button-increase-quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <span className="text-sm text-muted-foreground">
                  Max: {product.currentStock}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleAddToCart}
              disabled={product.currentStock === 0 || addToCartMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="lg"
              data-testid="button-add-to-cart"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {addToCartMutation.isPending ? "Adding..." : 
               product.currentStock === 0 ? "Out of Stock" : "Add to Cart"}
            </Button>
            
            {product.requiresPrescription && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-800">Prescription Required</p>
                    <p className="text-sm text-orange-700 mt-1">
                      This medication requires a valid prescription. Please upload your prescription during checkout.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Key Features */}
          <div className="space-y-2">
            <h3 className="font-semibold">Why Choose Us?</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>Licensed Pharmacy</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>Fast Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>Quality Guaranteed</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>Expert Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Information Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0">
              <TabsTrigger value="details" className="rounded-none" data-testid="tab-details">
                Product Details
              </TabsTrigger>
              <TabsTrigger value="information" className="rounded-none" data-testid="tab-information">
                Drug Information
              </TabsTrigger>
              <TabsTrigger value="shipping" className="rounded-none" data-testid="tab-shipping">
                Shipping & Returns
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="details" className="mt-0">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Product Description</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {product.description || `${product.medicationName} ${product.dosage} is a high-quality medication available at Luton Hospital Pharmacy. Our licensed pharmacists ensure all medications meet the highest standards of quality and safety.`}
                    </p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold">Product Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Product Name:</span>
                          <span>{product.medicationName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Dosage:</span>
                          <span>{product.dosage}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Category:</span>
                          <span>{formatCategory(product.category)}</span>
                        </div>
                        {product.supplier && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Supplier:</span>
                            <span>{product.supplier}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">Availability</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Stock Status:</span>
                          <span className={`text-${stockStatus.color}-600 font-medium`}>
                            {stockStatus.status}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Units Available:</span>
                          <span>{product.currentStock}</span>
                        </div>
                        {product.expiryDate && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Expiry Date:</span>
                            <span>{formatExpiryDate(product.expiryDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="information" className="mt-0">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Important Information</h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-2">
                        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-800">Medical Guidance Required</p>
                          <p className="text-sm text-blue-700 mt-1">
                            Always consult with your healthcare provider before starting any new medication. 
                            This information is for reference only and should not replace professional medical advice.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">General Guidelines</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Store in a cool, dry place away from direct sunlight</li>
                      <li>• Keep out of reach of children</li>
                      <li>• Do not use after expiry date</li>
                      <li>• Take exactly as prescribed by your healthcare provider</li>
                      <li>• Complete the full course even if you feel better</li>
                    </ul>
                  </div>

                  {product.requiresPrescription && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-semibold text-red-800 mb-2">Prescription Only Medicine (POM)</h4>
                      <p className="text-sm text-red-700">
                        This medication is only available with a valid prescription from a registered healthcare provider. 
                        Our pharmacists will verify your prescription before dispensing.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="shipping" className="mt-0">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Delivery Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Truck className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-medium">Same Day Delivery</h4>
                            <p className="text-sm text-muted-foreground">
                              Orders placed before 2 PM are eligible for same-day delivery within Nairobi.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-medium">Standard Delivery</h4>
                            <p className="text-sm text-muted-foreground">
                              1-3 business days for orders outside Nairobi. Free delivery on orders over KES 2,000.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Building className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-medium">Pharmacy Pickup</h4>
                            <p className="text-sm text-muted-foreground">
                              Collect your order from our pharmacy counter. Ready in 2-4 hours.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <Shield className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-medium">Secure Packaging</h4>
                            <p className="text-sm text-muted-foreground">
                              All medications are securely packaged to maintain quality and confidentiality.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Returns Policy</h3>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        <strong>Important:</strong> For safety and regulatory reasons, medications cannot be returned once dispensed. 
                        Please ensure your order is correct before confirming purchase. If you receive damaged or incorrect items, 
                        contact us immediately for a replacement.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}