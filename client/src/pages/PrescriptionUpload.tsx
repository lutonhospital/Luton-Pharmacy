import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertPrescriptionUploadSchema, type PrescriptionUpload } from "@shared/schema";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, CheckCircle, Clock, XCircle, Camera, AlertCircle } from "lucide-react";

// Extend the shared schema with additional form fields for UI
const uploadFormSchema = insertPrescriptionUploadSchema.extend({
  // Additional fields for UI form - these won't be sent to backend
  patientName: z.string().min(2, "Patient name is required"),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
  deliveryAddress: z.string().min(10, "Delivery address is required"),
}).omit({
  patientId: true, // Will be set automatically on backend
  fileName: true, // Will be set from file
  fileUrl: true, // Will be generated on backend
});

type UploadFormData = z.infer<typeof uploadFormSchema>;

export default function PrescriptionUpload() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      notes: "",
      patientName: "",
      phoneNumber: "",
      deliveryAddress: "",
    },
  });

  // Fetch user's prescription uploads
  const { data: prescriptionUploads, isLoading: uploadsLoading } = useQuery({
    queryKey: ["/api/prescription-uploads"],
    enabled: !!user,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: UploadFormData & { file: File }) => {
      const uploadData = {
        fileName: data.file.name,
        notes: data.notes || null,
        // Additional form data for context (not persisted in database)
        patientName: data.patientName,
        phoneNumber: data.phoneNumber,
        deliveryAddress: data.deliveryAddress,
      };

      return apiRequest("/api/prescription-uploads", "POST", uploadData);
    },
    onSuccess: () => {
      toast({
        title: "Prescription uploaded successfully",
        description: "Your prescription is being processed. You'll receive a confirmation shortly.",
      });
      form.reset();
      setSelectedFile(null);
      setPreviewUrl(null);
      queryClient.invalidateQueries({ queryKey: ["/api/prescription-uploads"] });
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your prescription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type and size
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a JPEG, PNG, or PDF file",
          variant: "destructive",
        });
        return;
      }

      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      
      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setPreviewUrl(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const onSubmit = (data: UploadFormData) => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a prescription file to upload",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({ ...data, file: selectedFile });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "processed":
        return <Badge variant="outline" className="text-blue-600"><FileText className="w-3 h-3 mr-1" />Processed</Badge>;
      case "approved":
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="text-red-600"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation user={user} />
        <div className="container mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Login Required</h1>
          <p className="text-gray-600 mb-8">Please log in to upload prescriptions and track your orders.</p>
          <Button className="bg-primary hover:bg-primary/90" data-testid="button-login-required">
            Log In to Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Upload Prescription</h1>
            <p className="text-xl text-gray-600">
              Upload your prescription and get your medicines delivered to your doorstep in Kenya
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <Tabs defaultValue="upload" className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" data-testid="tab-upload">Upload New</TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">My Uploads</TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Your Prescription
                </CardTitle>
                <CardDescription>
                  Please upload a clear image or PDF of your prescription. Our pharmacists will review it and process your order.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* File Upload Section */}
                    <div className="space-y-4">
                      <FormLabel>Prescription File *</FormLabel>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="prescription-file"
                          data-testid="input-prescription-file"
                        />
                        <label
                          htmlFor="prescription-file"
                          className="cursor-pointer block"
                        >
                          {selectedFile ? (
                            <div className="space-y-3">
                              {previewUrl ? (
                                <img
                                  src={previewUrl}
                                  alt="Prescription preview"
                                  className="max-w-xs max-h-48 mx-auto rounded border"
                                  data-testid="image-prescription-preview"
                                />
                              ) : (
                                <FileText className="w-16 h-16 text-primary mx-auto" />
                              )}
                              <p className="text-sm font-medium text-gray-700">{selectedFile.name}</p>
                              <p className="text-xs text-gray-500">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <Camera className="w-16 h-16 text-gray-400 mx-auto" />
                              <div>
                                <p className="text-lg font-medium text-gray-700">
                                  Click to upload prescription
                                </p>
                                <p className="text-sm text-gray-500">
                                  Supports: JPEG, PNG, PDF (Max 5MB)
                                </p>
                              </div>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Patient Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="patientName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Patient Name *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter patient's full name" 
                                {...field} 
                                data-testid="input-patient-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="0712345678" 
                                {...field} 
                                data-testid="input-phone-number"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="deliveryAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delivery Address *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter complete delivery address including landmarks"
                              className="min-h-20"
                              {...field} 
                              data-testid="textarea-delivery-address"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Any special instructions or notes about your prescription"
                              {...field}
                              value={field.value || ""}
                              data-testid="textarea-notes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary/90 text-white py-3"
                      disabled={uploadMutation.isPending}
                      data-testid="button-submit-prescription"
                    >
                      {uploadMutation.isPending ? "Uploading..." : "Upload Prescription"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-green-600 mb-2">✓ Good Practice</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Clear, well-lit photos</li>
                      <li>• All text clearly readable</li>
                      <li>• Doctor's signature visible</li>
                      <li>• Complete prescription in frame</li>
                      <li>• PDF files from digital prescriptions</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-600 mb-2">✗ Avoid</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Blurry or dark images</li>
                      <li>• Partial prescriptions</li>
                      <li>• Expired prescriptions</li>
                      <li>• Images with glare</li>
                      <li>• Handwritten unclear notes</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Prescription Uploads</CardTitle>
                <CardDescription>
                  Track the status of your uploaded prescriptions and orders
                </CardDescription>
              </CardHeader>
              <CardContent>
                {uploadsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                    <p className="text-gray-600 mt-4">Loading your uploads...</p>
                  </div>
                ) : prescriptionUploads && Array.isArray(prescriptionUploads) && prescriptionUploads.length > 0 ? (
                  <div className="space-y-4">
                    {(prescriptionUploads as PrescriptionUpload[]).map((upload: PrescriptionUpload) => (
                      <div 
                        key={upload.id} 
                        className="border rounded-lg p-4 space-y-3"
                        data-testid={`upload-item-${upload.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-primary" />
                            <div>
                              <p className="font-medium text-gray-800">{upload.fileName}</p>
                              <p className="text-sm text-gray-600">
                                Uploaded {upload.createdAt ? new Date(upload.createdAt).toLocaleDateString() : 'Unknown'}
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(upload.status || 'pending')}
                        </div>
                        
                        {upload.notes && (
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                            <strong>Notes:</strong> {upload.notes}
                          </p>
                        )}
                        
                        {upload.processedAt && (
                          <p className="text-xs text-gray-500">
                            Processed on {new Date(upload.processedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No prescriptions uploaded yet</p>
                    <Button 
                      onClick={() => {
                        const tabElement = document.querySelector('[data-testid="tab-upload"]') as HTMLElement;
                        tabElement?.click();
                      }}
                      variant="outline"
                      data-testid="button-upload-first"
                    >
                      Upload Your First Prescription
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}