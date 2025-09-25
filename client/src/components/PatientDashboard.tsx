import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, PillBottle, Clock, CheckCircle, PoundSterling, Camera, MessageSquare, History, AlertTriangle } from "lucide-react";
import PrescriptionCard from "./PrescriptionCard";
import OrderCard from "./OrderCard";
import type { User } from "@shared/schema";
import type { DashboardStats } from "@/types";

interface PatientDashboardProps {
  user: User;
}

export default function PatientDashboard({ user }: PatientDashboardProps) {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: prescriptions, isLoading: prescriptionsLoading } = useQuery({
    queryKey: ["/api/prescriptions"],
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders"],
  });

  const { data: addresses } = useQuery({
    queryKey: ["/api/addresses"],
  });

  const primaryAddress = (addresses as any[])?.find((addr: any) => addr.isPrimary) || (addresses as any[])?.[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Welcome back, {user.firstName}
        </h2>
        <p className="text-muted-foreground">Manage your prescriptions and track your orders</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Prescriptions</p>
                <p className="text-2xl font-semibold text-foreground">
                  {statsLoading ? "..." : stats?.activePrescriptions || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <PillBottle className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending Orders</p>
                <p className="text-2xl font-semibold text-foreground">
                  {statsLoading ? "..." : stats?.pendingOrders || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Ready for Pickup</p>
                <p className="text-2xl font-semibold text-foreground">
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
                <p className="text-sm text-muted-foreground mb-1">This Month</p>
                <p className="text-2xl font-semibold text-foreground">
                  {statsLoading ? "..." : stats?.monthlyTotal || "£0"}
                </p>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <PoundSterling className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Prescriptions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Prescriptions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Prescriptions</CardTitle>
                <Button data-testid="button-request-refill">Request Refill</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search and Filter */}
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search prescriptions..." 
                    className="pl-10"
                    data-testid="input-search-prescriptions"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default" data-testid="filter-all">All</Badge>
                  <Badge variant="secondary" data-testid="filter-active">Active</Badge>
                  <Badge variant="secondary" data-testid="filter-pending">Pending</Badge>
                  <Badge variant="secondary" data-testid="filter-completed">Completed</Badge>
                </div>
              </div>

              {/* Prescriptions List */}
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
                      isPatientView={true}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No prescriptions found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment & Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Payment & Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ordersLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                  </div>
                ) : (orders as any[])?.length > 0 ? (
                  (orders as any[]).slice(0, 3).map((order: any) => (
                    <OrderCard key={order.id} order={order} />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No orders found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Profile & Actions */}
        <div className="space-y-6">
          {/* Profile */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Profile</CardTitle>
                <Button variant="ghost" size="sm" data-testid="button-edit-profile">Edit</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center pb-4 border-b border-border">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold mx-auto mb-3">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
                <h4 className="font-medium text-foreground">{user.firstName} {user.lastName}</h4>
                <p className="text-sm text-muted-foreground">Patient ID: {user.id.slice(-8)}</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Email</label>
                  <p className="text-sm text-foreground">{user.email}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Phone</label>
                  <p className="text-sm text-foreground">{user.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Date of Birth</label>
                  <p className="text-sm text-foreground">
                    {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">NHS Number</label>
                  <p className="text-sm text-foreground">{user.nhsNumber || 'Not provided'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Addresses */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Delivery Addresses</CardTitle>
                <Button variant="ghost" size="sm" data-testid="button-add-address">Add New</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {primaryAddress ? (
                  <div className="border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="default" className="bg-primary/10 text-primary">Primary</Badge>
                    </div>
                    <p className="text-sm text-foreground font-medium">{primaryAddress.label}</p>
                    <p className="text-sm text-muted-foreground">{primaryAddress.line1}</p>
                    <p className="text-sm text-muted-foreground">{primaryAddress.city}, {primaryAddress.postcode}</p>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No addresses found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-between" 
                  data-testid="button-upload-prescription"
                >
                  <div className="flex items-center space-x-3">
                    <Camera className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Upload Prescription</span>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                  data-testid="button-contact-pharmacy"
                >
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Contact Pharmacy</span>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                  data-testid="button-order-history"
                >
                  <div className="flex items-center space-x-3">
                    <History className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Order History</span>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-between text-destructive hover:text-destructive"
                  data-testid="button-emergency-info"
                >
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium">Emergency Info</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
