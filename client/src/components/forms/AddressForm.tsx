import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertAddressSchema } from "@shared/schema";

const addressFormSchema = insertAddressSchema.extend({
  isPrimary: z.boolean().default(false),
});

type AddressFormData = z.infer<typeof addressFormSchema>;

interface AddressFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  existingAddress?: any;
  isEditing?: boolean;
}

export default function AddressForm({ 
  onSuccess, 
  onCancel, 
  existingAddress, 
  isEditing = false 
}: AddressFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: existingAddress ? {
      label: existingAddress.label || "",
      line1: existingAddress.line1 || "",
      line2: existingAddress.line2 || "",
      city: existingAddress.city || "",
      postcode: existingAddress.postcode || "",
      isPrimary: existingAddress.isPrimary || false,
    } : {
      label: "",
      line1: "",
      line2: "",
      city: "",
      postcode: "",
      isPrimary: false,
    },
  });

  const createAddressMutation = useMutation({
    mutationFn: async (data: AddressFormData) => {
      const response = await apiRequest("POST", "/api/addresses", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({
        title: "Address Added",
        description: "Your new address has been added successfully.",
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
        description: "Failed to add address. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: async (data: AddressFormData) => {
      const response = await apiRequest("PUT", `/api/addresses/${existingAddress.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({
        title: "Address Updated",
        description: "Your address has been updated successfully.",
      });
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
        description: "Failed to update address. Please try again.",
        variant: "destructive",
      });
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async (addressId: string) => {
      const response = await apiRequest("PATCH", `/api/addresses/${addressId}/primary`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({
        title: "Primary Address Updated",
        description: "Your primary address has been updated.",
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
        description: "Failed to update primary address.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: AddressFormData) => {
    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateAddressMutation.mutateAsync(data);
        // If setting as primary, make the additional call
        if (data.isPrimary && !existingAddress.isPrimary) {
          await setPrimaryMutation.mutateAsync(existingAddress.id);
        }
      } else {
        const newAddress = await createAddressMutation.mutateAsync(data);
        // If setting as primary, make the additional call
        if (data.isPrimary && newAddress.id) {
          await setPrimaryMutation.mutateAsync(newAddress.id);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Address" : "Add New Address"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Label</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Home, Work, etc."
                      {...field}
                      data-testid="input-address-label"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="line1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 1</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Street address"
                      {...field}
                      data-testid="input-address-line1"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="line2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 2 (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Apartment, suite, etc."
                      {...field}
                      value={field.value || ""}
                      data-testid="input-address-line2"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="City"
                        {...field}
                        data-testid="input-address-city"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="postcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postcode</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Postcode"
                        {...field}
                        data-testid="input-address-postcode"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isPrimary"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="checkbox-primary-address"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Set as primary address
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      This will be used as your default delivery address
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3">
              {onCancel && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                  data-testid="button-cancel-address"
                >
                  Cancel
                </Button>
              )}
              <Button 
                type="submit" 
                disabled={isSubmitting}
                data-testid="button-save-address"
              >
                {isSubmitting ? "Saving..." : isEditing ? "Update Address" : "Add Address"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
