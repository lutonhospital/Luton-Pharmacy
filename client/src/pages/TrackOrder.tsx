import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, Truck, MapPin, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "wouter";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  estimatedReadyTime?: string;
  items: {
    medicationName: string;
    quantity: number;
    unitPrice: string;
  }[];
}

export default function TrackOrder() {
  const { user } = useAuth();
  const [orderNumber, setOrderNumber] = useState("");
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [searchError, setSearchError] = useState("");

  // Fetch user's orders if logged in
  const { data: userOrders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: !!user,
  });

  const handleTrackOrder = async () => {
    if (!orderNumber.trim()) {
      setSearchError("Please enter an order number");
      return;
    }

    try {
      setSearchError("");
      // For demo purposes, we'll simulate a search
      // In real implementation, this would be an API call
      const mockOrder: Order = {
        id: "1",
        orderNumber: orderNumber.toUpperCase(),
        status: "processing",
        totalAmount: "2500.00",
        createdAt: new Date().toISOString(),
        estimatedReadyTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        items: [
          { medicationName: "Paracetamol 500mg", quantity: 20, unitPrice: "15.00" },
          { medicationName: "Amoxicillin 250mg", quantity: 21, unitPrice: "45.00" }
        ]
      };
      setSearchedOrder(mockOrder);
    } catch (error) {
      setSearchError("Order not found. Please check your order number and try again.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_payment":
        return <Badge variant="outline" className="text-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending Payment</Badge>;
      case "paid":
        return <Badge variant="outline" className="text-blue-600"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>;
      case "processing":
        return <Badge variant="outline" className="text-blue-600"><Package className="w-3 h-3 mr-1" />Processing</Badge>;
      case "ready":
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Ready</Badge>;
      case "completed":
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="text-red-600"><AlertCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Order #{order.orderNumber}</CardTitle>
            <CardDescription>Placed on {formatDate(order.createdAt)}</CardDescription>
          </div>
          {getStatusBadge(order.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Order Details</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p>Total Amount: <span className="font-semibold">KES {order.totalAmount}</span></p>
              <p>Items: {order.items.length} item(s)</p>
              {order.estimatedReadyTime && (
                <p>Estimated Ready: {formatDate(order.estimatedReadyTime)}</p>
              )}
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Items Ordered</h4>
            <div className="space-y-1 text-sm text-gray-600">
              {order.items.map((item, index) => (
                <p key={index}>
                  {item.medicationName} × {item.quantity} - KES {(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}
                </p>
              ))}
            </div>
          </div>
        </div>
        
        {/* Order Status Timeline */}
        <div className="mt-6">
          <h4 className="font-semibold text-gray-800 mb-3">Order Status</h4>
          <div className="flex items-center space-x-4 text-sm">
            <div className={`flex items-center space-x-2 ${order.status === 'pending_payment' ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-3 h-3 rounded-full ${order.status === 'pending_payment' ? 'bg-primary' : 'bg-gray-300'}`}></div>
              <span>Payment</span>
            </div>
            <div className="flex-1 h-px bg-gray-300"></div>
            <div className={`flex items-center space-x-2 ${['paid', 'processing', 'ready', 'completed'].includes(order.status) ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-3 h-3 rounded-full ${['paid', 'processing', 'ready', 'completed'].includes(order.status) ? 'bg-primary' : 'bg-gray-300'}`}></div>
              <span>Processing</span>
            </div>
            <div className="flex-1 h-px bg-gray-300"></div>
            <div className={`flex items-center space-x-2 ${['ready', 'completed'].includes(order.status) ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-3 h-3 rounded-full ${['ready', 'completed'].includes(order.status) ? 'bg-primary' : 'bg-gray-300'}`}></div>
              <span>Ready</span>
            </div>
            <div className="flex-1 h-px bg-gray-300"></div>
            <div className={`flex items-center space-x-2 ${order.status === 'completed' ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-3 h-3 rounded-full ${order.status === 'completed' ? 'bg-primary' : 'bg-gray-300'}`}></div>
              <span>Delivered</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <Truck className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Track Your Order</h1>
            <p className="text-xl text-gray-600">
              Enter your order number below or view your recent orders
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          
          {/* Order Search */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Track Order by Number
              </CardTitle>
              <CardDescription>
                Enter your order number to track its current status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="orderNumber">Order Number</Label>
                  <Input
                    id="orderNumber"
                    placeholder="e.g., LH2024001"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    data-testid="input-order-number"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleTrackOrder} data-testid="button-track-order">
                    Track Order
                  </Button>
                </div>
              </div>
              {searchError && (
                <p className="text-red-600 text-sm">{searchError}</p>
              )}
            </CardContent>
          </Card>

          {/* Search Result */}
          {searchedOrder && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Order Found</h2>
              <OrderCard order={searchedOrder} />
            </div>
          )}

          {/* User Orders */}
          {user && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Recent Orders</h2>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                  <p className="mt-2 text-gray-600">Loading your orders...</p>
                </div>
              ) : userOrders && userOrders.length > 0 ? (
                userOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No orders found</p>
                    <Link href="/shop">
                      <Button>Start Shopping</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Guest Message */}
          {!user && !searchedOrder && (
            <Card>
              <CardContent className="text-center py-8">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Track Your Order</h3>
                <p className="text-gray-600 mb-4">
                  Enter your order number above to track its status, or login to view all your orders
                </p>
                <Link href="/login">
                  <Button variant="outline">Login to View All Orders</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          <div className="mt-8">
            <Link href="/">
              <Button variant="outline" className="flex items-center gap-2" data-testid="button-back-home">
                <ArrowLeft className="h-4 w-4" />
                Back to Homepage
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}