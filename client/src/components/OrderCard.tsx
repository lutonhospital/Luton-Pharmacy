import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, FileText, Calendar } from "lucide-react";

interface OrderCardProps {
  order: any;
}

export default function OrderCard({ order }: OrderCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-accent/10 text-accent">Paid</Badge>;
      case "pending_payment":
        return <Badge className="bg-yellow-100 text-yellow-800">Payment Required</Badge>;
      case "processing":
        return <Badge className="bg-primary/10 text-primary">Processing</Badge>;
      case "ready":
        return <Badge className="bg-accent/10 text-accent">Ready</Badge>;
      case "completed":
        return <Badge className="bg-accent/10 text-accent">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status.replace('_', ' ')}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const isPaid = order.status === "paid" || order.status === "processing" || order.status === "ready" || order.status === "completed";

  return (
    <Card className="border border-border rounded-lg">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-medium text-foreground">Order #{order.orderNumber}</h4>
            <p className="text-sm text-muted-foreground">
              Created: {formatDate(order.createdAt)}
            </p>
            {order.deliveryMethod && (
              <p className="text-sm text-muted-foreground">
                Method: {order.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-foreground">£{order.totalAmount}</p>
            {getStatusBadge(order.status)}
          </div>
        </div>

        <div className="flex items-center space-x-4 text-sm">
          {isPaid ? (
            <>
              <Button variant="ghost" size="sm" data-testid={`button-view-receipt-${order.id}`}>
                <FileText className="h-4 w-4 mr-1" />
                View Receipt
              </Button>
              {order.status === "ready" && (
                <Button variant="ghost" size="sm" data-testid={`button-schedule-pickup-${order.id}`}>
                  <Calendar className="h-4 w-4 mr-1" />
                  Schedule Pickup
                </Button>
              )}
            </>
          ) : (
            <Button 
              className="w-full"
              onClick={() => window.location.href = `/payment/${order.id}`}
              data-testid={`button-pay-now-${order.id}`}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Pay Now
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
