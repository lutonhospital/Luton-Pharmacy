export interface DashboardStats {
  activePrescriptions?: number;
  pendingOrders?: number;
  readyForPickup?: number;
  pendingApprovals?: number;
  inProgress?: number;
  stockAlerts?: number;
  monthlyTotal?: string;
  todayRevenue?: string;
}

export interface PrescriptionFilters {
  status: string;
  search: string;
}

export interface OrderFilters {
  status: string;
  dateRange: string;
}
