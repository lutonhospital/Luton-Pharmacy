import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Package,
  ShoppingCart,
  FileText,
  DollarSign,
  AlertTriangle,
  Users,
  Calendar,
  Activity,
  Plus,
  Eye,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface DashboardStats {
  orders: {
    pending: number;
    approved: number;
    fulfilled: number;
    delivered: number;
    cancelled: number;
    total: number;
  };
  sales: {
    today: number;
    week: number;
    month: number;
  };
  revenue: {
    paid: number;
    pending: number;
  };
  lowStockAlerts: number;
  newConsultations: number;
  totalProducts: number;
  activeUsers: number;
}

export default function AdminDashboard() {
  const { user, isAuthenticated, isAdmin } = useAdminAuth();

  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated && isAdmin,
  });

  // Redirect if not authorized
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <CardContent className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-gray-600 mb-4">
              You need admin privileges to access this dashboard. Please log in with admin credentials.
            </p>
            <Link href="/admin/login">
              <Button>Go to Admin Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900" data-testid="text-admin-title">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {user?.firstName || 'Admin'} {user?.lastName || 'User'}
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/admin/products/add">
                <Button className="flex items-center gap-2" data-testid="button-add-product">
                  <Plus className="h-4 w-4" />
                  Add Product
                </Button>
              </Link>
              <Link href="/admin/orders">
                <Button variant="outline" className="flex items-center gap-2" data-testid="button-view-orders">
                  <Eye className="h-4 w-4" />
                  View Orders
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Orders */}
          <Card data-testid="card-total-orders">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-orders">
                {statsLoading ? "-" : stats?.orders.total || 0}
              </div>
              <p className="text-xs text-muted-foreground">All time orders</p>
            </CardContent>
          </Card>

          {/* Monthly Revenue */}
          <Card data-testid="card-monthly-revenue">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-monthly-revenue">
                KES {statsLoading ? "-" : stats?.sales.month?.toLocaleString() || "0"}
              </div>
              <p className="text-xs text-muted-foreground">This month's sales</p>
            </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          <Card data-testid="card-low-stock">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600" data-testid="text-low-stock-count">
                {statsLoading ? "-" : stats?.lowStockAlerts || 0}
              </div>
              <p className="text-xs text-muted-foreground">Items below minimum</p>
            </CardContent>
          </Card>

          {/* New Consultations */}
          <Card data-testid="card-new-consultations">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Consultations</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-new-consultations">
                {statsLoading ? "-" : stats?.newConsultations || 0}
              </div>
              <p className="text-xs text-muted-foreground">Pending responses</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Orders Summary */}
          <Card data-testid="card-orders-summary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Orders Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pending Payment</span>
                    <Badge variant="outline" data-testid="badge-pending-orders">
                      {stats?.orders.pending || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Processing</span>
                    <Badge className="bg-yellow-100 text-yellow-800" data-testid="badge-processing-orders">
                      {stats?.orders.approved || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Ready for Pickup</span>
                    <Badge className="bg-blue-100 text-blue-800" data-testid="badge-ready-orders">
                      {stats?.orders.fulfilled || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Delivered</span>
                    <Badge className="bg-green-100 text-green-800" data-testid="badge-delivered-orders">
                      {stats?.orders.delivered || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Cancelled</span>
                    <Badge variant="destructive" data-testid="badge-cancelled-orders">
                      {stats?.orders.cancelled || 0}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card data-testid="card-quick-actions">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <Link href="/admin/orders">
                  <Button variant="outline" className="w-full justify-start" data-testid="link-manage-orders">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Manage Orders
                  </Button>
                </Link>
                <Link href="/admin/prescriptions">
                  <Button variant="outline" className="w-full justify-start" data-testid="link-verify-prescriptions">
                    <FileText className="mr-2 h-4 w-4" />
                    Verify Prescriptions
                  </Button>
                </Link>
                <Link href="/admin/products">
                  <Button variant="outline" className="w-full justify-start" data-testid="link-manage-products">
                    <Package className="mr-2 h-4 w-4" />
                    Manage Products
                  </Button>
                </Link>
                <Link href="/admin/consultations">
                  <Button variant="outline" className="w-full justify-start" data-testid="link-consultations">
                    <Users className="mr-2 h-4 w-4" />
                    Consultations
                  </Button>
                </Link>
                <Link href="/admin/import">
                  <Button variant="outline" className="w-full justify-start" data-testid="link-import-products">
                    <FileText className="mr-2 h-4 w-4" />
                    Import Products
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Sales Performance */}
          <Card data-testid="card-sales-performance">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Sales Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Today</span>
                    <span className="font-semibold" data-testid="text-sales-today">
                      KES {stats?.sales.today?.toLocaleString() || "0"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">This Week</span>
                    <span className="font-semibold" data-testid="text-sales-week">
                      KES {stats?.sales.week?.toLocaleString() || "0"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">This Month</span>
                    <span className="font-semibold" data-testid="text-sales-month">
                      KES {stats?.sales.month?.toLocaleString() || "0"}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Status */}
          <Card data-testid="card-payment-status">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Paid Orders</span>
                    <span className="font-semibold text-green-600" data-testid="text-paid-revenue">
                      KES {stats?.revenue.paid?.toLocaleString() || "0"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pending Payments</span>
                    <span className="font-semibold text-orange-600" data-testid="text-pending-revenue">
                      KES {stats?.revenue.pending?.toLocaleString() || "0"}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Overview */}
          <Card data-testid="card-system-overview">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                System Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Products</span>
                    <span className="font-semibold" data-testid="text-total-products">
                      {stats?.totalProducts || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Active Users</span>
                    <span className="font-semibold" data-testid="text-active-users">
                      {stats?.activeUsers || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Low Stock Items</span>
                    <span className={`font-semibold ${
                      (stats?.lowStockAlerts || 0) > 0 ? 'text-red-600' : 'text-green-600'
                    }`} data-testid="text-low-stock-items">
                      {stats?.lowStockAlerts || 0}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}