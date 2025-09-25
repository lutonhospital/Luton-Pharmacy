import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertConsultationSchema, type Consultation } from "@shared/schema";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Video, User, CheckCircle, XCircle, AlertCircle } from "lucide-react";

// Extend the shared schema for UI form
const consultationFormSchema = insertConsultationSchema.extend({
  scheduledDate: z.string().min(1, "Please select a date and time"),
}).omit({
  patientId: true, // Will be set automatically on backend
  status: true, // Will be set to "scheduled" on backend
});

type ConsultationFormData = z.infer<typeof consultationFormSchema>;

const consultationTypes = [
  { value: "general", label: "General Consultation", description: "Health questions and basic medical advice" },
  { value: "medication_review", label: "Medication Review", description: "Review your current medications and side effects" },
  { value: "prescription_query", label: "Prescription Query", description: "Questions about prescription medications" }
];

export default function Consultation() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ConsultationFormData>({
    resolver: zodResolver(consultationFormSchema),
    defaultValues: {
      type: "",
      scheduledDate: "",
      duration: 30,
      notes: "",
    },
  });

  // Fetch user's consultations
  const { data: consultations, isLoading: consultationsLoading } = useQuery({
    queryKey: ["/api/consultations"],
    enabled: !!user,
  });

  // Book consultation mutation
  const bookConsultationMutation = useMutation({
    mutationFn: async (data: ConsultationFormData) => {
      return apiRequest("/api/consultations", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Consultation booked successfully",
        description: "You will receive a confirmation email with meeting details.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/consultations"] });
    },
    onError: () => {
      toast({
        title: "Booking failed",
        description: "There was an error booking your consultation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ConsultationFormData) => {
    // Convert datetime-local string to ISO date string for backend
    const submitData = {
      ...data,
      scheduledDate: new Date(data.scheduledDate).toISOString(),
    };
    bookConsultationMutation.mutate(submitData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="outline" className="text-blue-600"><Clock className="w-3 h-3 mr-1" />Scheduled</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="text-orange-600"><Video className="w-3 h-3 mr-1" />In Progress</Badge>;
      case "completed":
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="text-red-600"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDateTime = (dateString: string | Date | null) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return date.toLocaleString('en-KE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <p className="text-gray-600 mb-8">Please log in to book consultations with our pharmacists.</p>
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
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Online Consultation</h1>
            <p className="text-xl text-gray-600">
              Consult with our qualified pharmacists from the comfort of your home
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <Tabs defaultValue="book" className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="book" data-testid="tab-book">Book Consultation</TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">My Consultations</TabsTrigger>
          </TabsList>

          {/* Book Consultation Tab */}
          <TabsContent value="book" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Video className="w-5 h-5 mr-2" />
                  Book a Consultation
                </CardTitle>
                <CardDescription>
                  Schedule a video consultation with one of our licensed pharmacists
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Consultation Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-consultation-type">
                                <SelectValue placeholder="Select consultation type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {consultationTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  <div>
                                    <div className="font-medium">{type.label}</div>
                                    <div className="text-sm text-gray-500">{type.description}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="scheduledDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred Date & Time *</FormLabel>
                            <FormControl>
                              <Input 
                                type="datetime-local"
                                {...field} 
                                data-testid="input-scheduled-date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration (minutes)</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger data-testid="select-duration">
                                  <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="15">15 minutes</SelectItem>
                                <SelectItem value="30">30 minutes</SelectItem>
                                <SelectItem value="45">45 minutes</SelectItem>
                                <SelectItem value="60">60 minutes</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your health concern or questions for the pharmacist"
                              className="min-h-24"
                              {...field}
                              value={field.value || ""}
                              data-testid="textarea-consultation-notes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary/90 text-white py-3"
                      disabled={bookConsultationMutation.isPending}
                      data-testid="button-book-consultation"
                    >
                      {bookConsultationMutation.isPending ? "Booking..." : "Book Consultation"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <User className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Licensed Pharmacists</h3>
                  <p className="text-gray-600 text-sm">Consult with qualified and experienced pharmacists</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Video className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Video Consultation</h3>
                  <p className="text-gray-600 text-sm">Face-to-face consultation via secure video call</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Flexible Timing</h3>
                  <p className="text-gray-600 text-sm">Available 7 days a week with flexible appointment slots</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Consultations</CardTitle>
                <CardDescription>
                  View your upcoming and past consultations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {consultationsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                    <p className="text-gray-600 mt-4">Loading your consultations...</p>
                  </div>
                ) : consultations && Array.isArray(consultations) && consultations.length > 0 ? (
                  <div className="space-y-4">
                    {(consultations as Consultation[]).map((consultation: Consultation) => (
                      <div 
                        key={consultation.id} 
                        className="border rounded-lg p-4 space-y-3"
                        data-testid={`consultation-item-${consultation.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Video className="w-5 h-5 text-primary" />
                            <div>
                              <p className="font-medium text-gray-800">
                                {consultation.type?.replace('_', ' ')?.replace(/\b\w/g, l => l.toUpperCase())}
                              </p>
                              <p className="text-sm text-gray-600">
                                {formatDateTime(consultation.scheduledDate)}
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(consultation.status || 'scheduled')}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>Duration: {consultation.duration || 30} minutes</span>
                          </div>
                          {consultation.meetingLink && (
                            <div className="flex items-center space-x-2">
                              <Video className="w-4 h-4 text-gray-400" />
                              <a 
                                href={consultation.meetingLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                                data-testid={`meeting-link-${consultation.id}`}
                              >
                                Join Meeting
                              </a>
                            </div>
                          )}
                        </div>
                        
                        {consultation.notes && (
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                            <strong>Notes:</strong> {consultation.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No consultations booked yet</p>
                    <Button 
                      onClick={() => {
                        const tabElement = document.querySelector('[data-testid="tab-book"]') as HTMLElement;
                        tabElement?.click();
                      }}
                      variant="outline"
                      data-testid="button-book-first"
                    >
                      Book Your First Consultation
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