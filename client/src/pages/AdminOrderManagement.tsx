import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import {
  Search,
  Filter,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  Truck,
  X,
  Download,
  RefreshCw,
  Package,
  DollarSign,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface OrderWithDetails {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  paymentIntentId?: string;
  deliveryMethod: string;
  estimatedReadyTime?: string;
  actualReadyTime?: string;
  dispensedTime?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  deliveryAddress?: {
    id: string;
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
  };
  items: Array<{
    id: string;
    medicationName: string;
    dosage: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    prescriptionId?: string;
  }>;
}

interface OrderFilters {
  search: string;
  status: string;
  paymentStatus: string;
  deliveryMethod: string;
  dateFrom: string;
  dateTo: string;
}

export default function AdminOrderManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [filters, setFilters] = useState<OrderFilters>({
    search: '',
    status: '',
    paymentStatus: '',
    deliveryMethod: '',
    dateFrom: '',
    dateTo: ''
  });

  // Fetch orders with filters
  const { data: orders, isLoading, refetch } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/admin/orders", filters],
    enabled: user?.role === "admin" || user?.role === "pharmacist",
  });

  // Update order status mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status, notes }: { orderId: string; status: string; notes?: string }) => {
      return apiRequest('PATCH', `/api/admin/orders/${orderId}`, { status, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Order updated successfully" });
      setSelectedOrder(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update order", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Redirect if not authorized
  if (!user || (user.role !== "admin" && user.role !== "pharmacist")) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <CardContent className="text-center">
            <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-gray-600 mb-4">
              You need admin or pharmacist privileges to access order management.
            </p>
            <Link href="/">
              <Button>Return to Homepage</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending_payment: { color: "bg-orange-100 text-orange-800", label: "Pending Payment" },
      paid: { color: "bg-green-100 text-green-800", label: "Paid" },
      processing: { color: "bg-blue-100 text-blue-800", label: "Processing" },
      ready: { color: "bg-purple-100 text-purple-800", label: "Ready" },
      completed: { color: "bg-green-100 text-green-800", label: "Completed" },
      cancelled: { color: "bg-red-100 text-red-800", label: "Cancelled" }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || { color: "bg-gray-100 text-gray-800", label: status };
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const handleStatusUpdate = (orderId: string, newStatus: string, notes?: string) => {
    updateOrderMutation.mutate({ orderId, status: newStatus, notes });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredOrders = orders || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900" data-testid="text-order-management-title">
                Order Management
              </h1>
              <p className="text-gray-600 mt-1">
                Monitor and manage all customer orders
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => refetch()} 
                variant="outline" 
                className="flex items-center gap-2"
                data-testid="button-refresh-orders"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Link href="/admin">
                <Button variant="outline" data-testid="button-back-admin">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters Section */}
        <Card className="mb-6" data-testid="card-order-filters">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filter Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search"
                    placeholder="Order number, patient name..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10"
                    data-testid="input-search-orders"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="status">Order Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger data-testid="select-order-status">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="pending_payment">Pending Payment</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Delivery Method Filter */}
              <div className="space-y-2">
                <Label htmlFor="delivery">Delivery Method</Label>
                <Select value={filters.deliveryMethod} onValueChange={(value) => setFilters({ ...filters, deliveryMethod: value })}>
                  <SelectTrigger data-testid="select-delivery-method">
                    <SelectValue placeholder="All Methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Methods</SelectItem>
                    <SelectItem value="pickup">Pickup</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label htmlFor="date-from">Date From</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  data-testid="input-date-from"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <Card data-testid="card-orders-list">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Orders ({filteredOrders.length})</span>
              <Button size="sm" variant="outline" data-testid="button-export-orders">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="h-20 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Found</h3>
                <p className="text-gray-600">No orders match your current filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    data-testid={`order-card-${order.orderNumber}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-start gap-4">
                        <div>
                          <h3 className="font-semibold text-lg" data-testid={`text-order-number-${order.orderNumber}`}>
                            #{order.orderNumber}
                          </h3>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {order.patient.firstName} {order.patient.lastName}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {order.patient.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="mb-2">{getStatusBadge(order.status)}</div>
                        <p className="font-semibold text-lg" data-testid={`text-order-total-${order.orderNumber}`}>
                          KES {parseFloat(order.totalAmount).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          {order.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </span>
                        {order.paymentIntentId && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            Paid
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setSelectedOrder(order)}
                              data-testid={`button-view-order-${order.orderNumber}`}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Order Details - #{selectedOrder?.orderNumber}</DialogTitle>
                              <DialogDescription>
                                Manage order status and view complete order information
                              </DialogDescription>
                            </DialogHeader>
                            {selectedOrder && (
                              <div className="space-y-6">
                                {/* Customer Information */}
                                <div>
                                  <h4 className="font-semibold mb-3">Customer Information</h4>
                                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                    <p><strong>Name:</strong> {selectedOrder.patient.firstName} {selectedOrder.patient.lastName}</p>
                                    <p><strong>Email:</strong> {selectedOrder.patient.email}</p>
                                    {selectedOrder.patient.phone && (
                                      <p><strong>Phone:</strong> {selectedOrder.patient.phone}</p>
                                    )}
                                  </div>
                                </div>

                                {/* Order Items */}
                                <div>
                                  <h4 className="font-semibold mb-3">Order Items</h4>
                                  <div className="space-y-2">
                                    {selectedOrder.items.map((item, index) => (
                                      <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <div>
                                          <p className="font-medium">{item.medicationName}</p>
                                          <p className="text-sm text-gray-600">{item.dosage}</p>
                                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-semibold">KES {parseFloat(item.totalPrice).toLocaleString()}</p>
                                          <p className="text-sm text-gray-600">@ KES {parseFloat(item.unitPrice).toLocaleString()}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Delivery Information */}
                                {selectedOrder.deliveryAddress && (
                                  <div>
                                    <h4 className="font-semibold mb-3">Delivery Address</h4>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                      <p>{selectedOrder.deliveryAddress.line1}</p>
                                      {selectedOrder.deliveryAddress.line2 && <p>{selectedOrder.deliveryAddress.line2}</p>}
                                      <p>{selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.postcode}</p>
                                    </div>
                                  </div>
                                )}

                                {/* Order Status Update */}
                                <div>
                                  <h4 className="font-semibold mb-3">Update Order Status</h4>
                                  <div className="flex gap-2 flex-wrap">
                                    {['paid', 'processing', 'ready', 'completed', 'cancelled'].map((status) => (
                                      <Button
                                        key={status}
                                        size="sm"
                                        variant={selectedOrder.status === status ? "default" : "outline"}
                                        onClick={() => handleStatusUpdate(selectedOrder.id, status)}
                                        disabled={updateOrderMutation.isPending}
                                        data-testid={`button-update-status-${status}`}
                                      >
                                        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                                      </Button>
                                    ))}
                                  </div>
                                </div>

                                {/* Notes */}
                                {selectedOrder.notes && (
                                  <div>
                                    <h4 className="font-semibold mb-3">Order Notes</h4>
                                    <p className="bg-gray-50 p-4 rounded-lg">{selectedOrder.notes}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}