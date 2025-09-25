import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

const refillRequestSchema = z.object({
  prescriptionId: z.string().min(1, "Please select a prescription"),
  deliveryMethod: z.enum(["pickup", "delivery"]),
  deliveryAddressId: z.string().optional(),
  urgentRequest: z.boolean().default(false),
  notes: z.string().optional(),
});

type RefillRequestForm = z.infer<typeof refillRequestSchema>;

interface RefillRequestFormProps {
  prescriptions: any[];
  addresses: any[];
  onSuccess?: () => void;
}

export default function RefillRequestForm({ 
  prescriptions, 
  addresses, 
  onSuccess 
}: RefillRequestFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RefillRequestForm>({
    resolver: zodResolver(refillRequestSchema),
    defaultValues: {
      deliveryMethod: "pickup",
      urgentRequest: false,
    },
  });

  const createRefillMutation = useMutation({
    mutationFn: async (data: RefillRequestForm) => {
      const response = await apiRequest("POST", "/api/refill-requests", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Refill Request Submitted",
        description: "Your refill request has been submitted for approval.",
      });
      form.reset();
      onSuccess?.();
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
        description: "Failed to submit refill request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: RefillRequestForm) => {
    setIsSubmitting(true);
    try {
      await createRefillMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const primaryAddress = addresses.find((addr: any) => addr.isPrimary) || addresses[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Prescription Refill</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="prescriptionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Prescription</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-prescription">
                        <SelectValue placeholder="Choose a prescription to refill" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {prescriptions
                        .filter((p: any) => p.refillsRemaining > 0)
                        .map((prescription: any) => (
                          <SelectItem key={prescription.id} value={prescription.id}>
                            {prescription.medicationName} - {prescription.dosage}
                            {prescription.refillsRemaining > 0 && ` (${prescription.refillsRemaining} refills left)`}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deliveryMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-delivery-method">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pickup">Pickup at Pharmacy</SelectItem>
                      <SelectItem value="delivery">Home Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("deliveryMethod") === "delivery" && primaryAddress && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium text-foreground mb-2">Delivery Address</h4>
                <p className="text-sm text-muted-foreground">
                  {primaryAddress.line1}<br />
                  {primaryAddress.line2 && `${primaryAddress.line2}\n`}
                  {primaryAddress.city}, {primaryAddress.postcode}
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any special instructions or notes..."
                      {...field}
                      data-testid="textarea-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full"
              data-testid="button-submit-refill"
            >
              {isSubmitting ? "Submitting..." : "Submit Refill Request"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
