import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Smartphone, Banknote } from "lucide-react";

type PaymentMethod = 'mpesa' | 'cash';

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: string;
  status: string;
}

const PaymentForm = ({ order }: { order: Order }) => {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  const [mpesaReceiptNumber, setMpesaReceiptNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const completeOrderMutation = useMutation({
    mutationFn: async (data: { orderId: string; paymentMethod: PaymentMethod; mpesaReceiptNumber?: string }) => {
      const response = await apiRequest("POST", "/api/complete-order", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Order Confirmed",
        description: data.message || "Your order has been confirmed successfully.",
      });
      setTimeout(() => {
        window.location.href = "/orders";
      }, 2000);
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Please login again.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to complete order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isProcessing) return;

    // Validate M-PESA receipt number if M-PESA is selected
    if (paymentMethod === 'mpesa' && !mpesaReceiptNumber.trim()) {
      toast({
        title: "Missing Receipt Number",
        description: "Please enter your M-PESA receipt number.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const paymentData: any = {
        orderId: order.id,
        paymentMethod,
      };

      if (paymentMethod === 'mpesa') {
        paymentData.mpesaReceiptNumber = mpesaReceiptNumber.trim();
      }

      completeOrderMutation.mutate(paymentData);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Method Selection */}
      <div className="space-y-4">
        <h3 className="font-medium text-foreground">Choose Payment Method</h3>
        <RadioGroup 
          value={paymentMethod} 
          onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
          className="space-y-3"
        >
          {/* M-PESA Option */}
          <div className="flex items-center space-x-3 border border-gray-200 rounded-lg p-4 hover:border-primary transition-colors">
            <RadioGroupItem value="mpesa" id="mpesa" />
            <Label htmlFor="mpesa" className="flex items-center space-x-3 cursor-pointer flex-1">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium">M-PESA (Recommended)</h4>
                <p className="text-sm text-gray-500">Pay instantly with M-PESA - Till: 9604725</p>
              </div>
            </Label>
          </div>

          {/* Cash Option */}
          <div className="flex items-center space-x-3 border border-gray-200 rounded-lg p-4 hover:border-primary transition-colors">
            <RadioGroupItem value="cash" id="cash" />
            <Label htmlFor="cash" className="flex items-center space-x-3 cursor-pointer flex-1">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Banknote className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium">Cash on Delivery</h4>
                <p className="text-sm text-gray-500">Pay when you collect your order</p>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* M-PESA Receipt Number Input */}
      {paymentMethod === 'mpesa' && (
        <div className="space-y-2">
          <Label htmlFor="mpesa-receipt">M-PESA Receipt Number</Label>
          <Input
            id="mpesa-receipt"
            type="text"
            placeholder="Enter M-PESA receipt number (e.g., QGK2X3Y4Z5)"
            value={mpesaReceiptNumber}
            onChange={(e) => setMpesaReceiptNumber(e.target.value)}
            data-testid="input-mpesa-receipt"
          />
          <p className="text-sm text-gray-500">
            You'll receive this after completing your M-PESA payment
          </p>
        </div>
      )}

      {/* Payment Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Payment Instructions</h4>
        {paymentMethod === 'mpesa' ? (
          <div className="text-sm text-blue-800 space-y-1">
            <p>1. Go to M-PESA on your phone</p>
            <p>2. Select "Lipa na M-PESA"</p>
            <p>3. Select "Buy Goods and Services"</p>
            <p>4. Enter Luton Hospital Till Number: <span className="font-bold">9604725</span></p>
            <p>5. Enter amount: <span className="font-bold">KES {order.totalAmount}</span></p>
            <p>6. Enter your PIN and confirm</p>
            <p>7. Copy the receipt number and enter it above</p>
          </div>
        ) : (
          <div className="text-sm text-blue-800">
            <p>You will pay in cash when you collect your order from Luton Hospital Pharmacy.</p>
            <p>Please bring the exact amount: <span className="font-bold">KES {order.totalAmount}</span></p>
          </div>
        )}
      </div>

      <Button 
        type="submit" 
        disabled={isProcessing || (paymentMethod === 'mpesa' && !mpesaReceiptNumber.trim())}
        className="w-full"
        data-testid="button-complete-order"
      >
        {isProcessing ? "Processing..." : 
         paymentMethod === 'mpesa' ? "Confirm M-PESA Payment" : "Confirm Cash Order"}
      </Button>
    </form>
  );
};

export default function Payment() {
  const params = useParams();
  const orderId = params.orderId as string;
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect if not authenticated
  if (!isLoading && !isAuthenticated) {
    toast({
      title: "Unauthorized",
      description: "Please login to complete your payment.",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/login";
    }, 500);
    return null;
  }

  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: [`/api/orders/${orderId}`],
    enabled: !!orderId && isAuthenticated,
  });

  if (isLoading || orderLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Order not found</p>
            <Button 
              className="mt-4" 
              onClick={() => window.location.href = "/"}
              data-testid="button-back-home"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Order Summary */}
            <div className="bg-muted rounded-lg p-4">
              <h3 className="font-medium text-foreground mb-2">Order Summary</h3>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Order #{(order as any).orderNumber}</span>
                <span className="font-semibold text-foreground">KES {(order as any).totalAmount}</span>
              </div>
            </div>

            <PaymentForm order={order as Order} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}