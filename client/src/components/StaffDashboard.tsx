import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Clock, CheckCircle, Cog, AlertTriangle, PoundSterling, RefreshCw } from "lucide-react";
import PrescriptionCard from "./PrescriptionCard";
import type { User } from "@shared/schema";
import type { DashboardStats } from "@/types";

interface StaffDashboardProps {
  user: User;
}

export default function StaffDashboard({ user }: StaffDashboardProps) {
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: prescriptions, isLoading: prescriptionsLoading } = useQuery({
    queryKey: ["/api/prescriptions"],
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders"],
  });

  const { data: lowStockItems, isLoading: inventoryLoading } = useQuery({
    queryKey: ["/api/inventory/low-stock"],
  });

  const updatePrescriptionMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const response = await apiRequest("PATCH", `/api/prescriptions/${id}/status`, { status, notes });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Prescription status updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update prescription status",
        variant: "destructive",
      });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/orders/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    },
  });

  const handleApprovePrescription = (prescriptionId: string) => {
    updatePrescriptionMutation.mutate({
      id: prescriptionId,
      status: "approved",
    });
  };

  const handleMarkOrderReady = (orderId: string) => {
    updateOrderMutation.mutate({
      id: orderId,
      status: "ready",
    });
  };

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/prescriptions"] });
    queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Staff Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-2">Pharmacy Staff Dashboard</h2>
        <p className="text-muted-foreground">Manage prescriptions, orders, and patient communications</p>
      </div>

      {/* Staff Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending Approvals</p>
                <p className="text-2xl font-semibold text-destructive">
                  {statsLoading ? "..." : stats?.pendingApprovals || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Ready for Pickup</p>
                <p className="text-2xl font-semibold text-accent">
                  {statsLoading ? "..." : stats?.readyForPickup || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">In Progress</p>
                <p className="text-2xl font-semibold text-foreground">
                  {statsLoading ? "..." : stats?.inProgress || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Cog className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Stock Alerts</p>
                <p className="text-2xl font-semibold text-destructive">
                  {statsLoading ? "..." : stats?.stockAlerts || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Today's Revenue</p>
                <p className="text-2xl font-semibold text-foreground">
                  {statsLoading ? "..." : stats?.todayRevenue || "£0"}
                </p>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <PoundSterling className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Prescription Management */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Prescriptions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Prescription Queue</CardTitle>
                <div className="flex space-x-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={refreshData} variant="outline" size="sm" data-testid="button-refresh-queue">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {prescriptionsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                  </div>
                ) : (prescriptions as any[])?.length > 0 ? (
                  (prescriptions as any[]).map((prescription: any) => (
                    <PrescriptionCard 
                      key={prescription.id} 
                      prescription={prescription}
                      isPatientView={false}
                      onApprove={() => handleApprovePrescription(prescription.id)}
                      onReject={() => updatePrescriptionMutation.mutate({
                        id: prescription.id,
                        status: "cancelled",
                        notes: "Requires clarification"
                      })}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No prescriptions in queue
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Order Management</CardTitle>
                <Button variant="outline" data-testid="button-generate-report">Generate Report</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr className="text-left">
                      <th className="pb-3 text-sm font-medium text-muted-foreground">Order ID</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">Patient</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">Total</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {ordersLoading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center">
                          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                        </td>
                      </tr>
                    ) : (orders as any[])?.length > 0 ? (
                      (orders as any[]).slice(0, 5).map((order: any) => (
                        <tr key={order.id}>
                          <td className="py-4 text-sm text-foreground font-medium">{order.orderNumber}</td>
                          <td className="py-4 text-sm text-foreground">Patient #{order.patientId.slice(-6)}</td>
                          <td className="py-4">
                            <Badge 
                              variant={order.status === 'ready' ? 'default' : 'secondary'}
                              className={order.status === 'ready' ? 'bg-accent/10 text-accent' : ''}
                            >
                              {order.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="py-4 text-sm text-foreground font-medium">£{order.totalAmount}</td>
                          <td className="py-4">
                            {order.status === 'processing' && (
                              <Button 
                                size="sm" 
                                onClick={() => handleMarkOrderReady(order.id)}
                                data-testid={`button-mark-ready-${order.id}`}
                              >
                                Mark Ready
                              </Button>
                            )}
                            {order.status === 'ready' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updateOrderMutation.mutate({ id: order.id, status: 'completed' })}
                                data-testid={`button-dispense-${order.id}`}
                              >
                                Dispense
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                          No orders found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Staff Tools */}
        <div className="space-y-6">
          {/* Stock Management */}
          <Card>
            <CardHeader>
              <CardTitle>Stock Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {inventoryLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                  </div>
                ) : (lowStockItems as any[])?.length > 0 ? (
                  (lowStockItems as any[]).slice(0, 3).map((item: any) => (
                    <div key={item.id} className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-foreground">{item.medicationName} {item.dosage}</h4>
                        <Badge variant="destructive" className="text-xs">
                          {item.currentStock === 0 ? 'Out of Stock' : 'Low Stock'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Current: {item.currentStock} | Min: {item.minimumStock}
                        </p>
                        <Button size="sm" variant="outline" data-testid={`button-reorder-${item.id}`}>
                          Reorder
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No stock alerts
                  </div>
                )}
                <Button variant="outline" className="w-full" data-testid="button-view-inventory">
                  View Full Inventory
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security & Compliance */}
          <Card>
            <CardHeader>
              <CardTitle>Security & Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-accent/5 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-accent" />
                    <span className="text-sm text-foreground">HIPAA Compliance</span>
                  </div>
                  <Badge variant="default" className="bg-accent/10 text-accent">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">Data Encryption</span>
                  </div>
                  <Badge variant="default" className="bg-accent/10 text-accent">Enabled</Badge>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">Audit Logs</span>
                  </div>
                  <Button size="sm" variant="ghost" data-testid="button-view-audit-logs">
                    View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
