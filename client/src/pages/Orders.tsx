import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, Clock, CheckCircle, Truck, Eye, Calendar, CreditCard } from "lucide-react";
import { Link } from "wouter";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: string;
  product: {
    medicationName: string;
    dosage: string;
    imageUrl?: string;
  };
}

interface Order {
  id: string;
  totalAmount: string;
  status: 'pending' | 'approved' | 'fulfilled' | 'delivered' | 'cancelled';
  deliveryMethod: 'pickup' | 'delivery';
  paymentMethod: 'cash' | 'card' | 'mpesa';
  paymentStatus: 'pending' | 'paid' | 'failed';
  createdAt: string;
  deliveryAddress?: string;
  items: OrderItem[];
}

export default function Orders() {
  const { user, isAuthenticated } = useAuth();

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <CardContent className="text-center">
            <h2 className="text-xl font-semibold mb-2">Please Login</h2>
            <p className="text-gray-600">You need to be logged in to view your orders.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'fulfilled': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'fulfilled': return <Package className="h-4 w-4" />;
      case 'delivered': return <Truck className="h-4 w-4" />;
      case 'cancelled': return <Eye className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="text-orders-title">My Orders</h1>
          <p className="text-gray-600 mt-2">Track and manage your pharmacy orders</p>
        </div>

        {!orders || orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Yet</h3>
              <p className="text-gray-600 mb-6">You haven't placed any orders yet. Start shopping to see your orders here.</p>
              <Link href="/shop">
                <Button data-testid="button-start-shopping">
                  Start Shopping
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                    <div>
                      <CardTitle className="text-lg">Order #{order.id.slice(-8)}</CardTitle>
                      <CardDescription className="flex items-center space-x-4 mt-1">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <CreditCard className="h-4 w-4 mr-1" />
                          KES {parseFloat(order.totalAmount).toFixed(2)}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <Badge className={getStatusColor(order.status)} data-testid={`status-${order.status}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1 capitalize">{order.status}</span>
                      </Badge>
                      <Badge className={getPaymentStatusColor(order.paymentStatus)} data-testid={`payment-${order.paymentStatus}`}>
                        <span className="capitalize">{order.paymentStatus}</span>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Order Items */}
                    <div className="lg:col-span-2">
                      <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                      <div className="space-y-3">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900" data-testid={`item-name-${item.id}`}>
                                {item.product.medicationName}
                              </p>
                              <p className="text-sm text-gray-600">{item.product.dosage}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium" data-testid={`item-quantity-${item.id}`}>
                                Qty: {item.quantity}
                              </p>
                              <p className="text-sm text-gray-600">
                                KES {parseFloat(item.unitPrice).toFixed(2)} each
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Details */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Order Details</h4>
                      <div className="space-y-3">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm text-gray-600">Delivery Method</p>
                          <p className="font-medium capitalize">{order.deliveryMethod}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm text-gray-600">Payment Method</p>
                          <p className="font-medium uppercase">{order.paymentMethod}</p>
                        </div>
                        {order.deliveryAddress && (
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-600">Delivery Address</p>
                            <p className="text-sm">{order.deliveryAddress}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                    <div>
                      <p className="text-lg font-semibold">
                        Total: KES {parseFloat(order.totalAmount).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Link href={`/track-order?id=${order.id}`}>
                        <Button variant="outline" size="sm" data-testid={`button-track-${order.id}`}>
                          <Truck className="h-4 w-4 mr-2" />
                          Track Order
                        </Button>
                      </Link>
                      {order.paymentStatus === 'pending' && (
                        <Link href={`/payment/${order.id}`}>
                          <Button size="sm" data-testid={`button-pay-${order.id}`}>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Pay Now
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}