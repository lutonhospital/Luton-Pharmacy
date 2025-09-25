import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import {
  FileText,
  Eye,
  CheckCircle,
  X,
  AlertTriangle,
  Calendar,
  Clock,
  User,
  MessageCircle,
  Video,
  Phone,
  Download,
  Upload,
  Flag,
  Stethoscope,
  Image as ImageIcon,
  RefreshCw
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface PrescriptionUpload {
  id: string;
  fileName: string;
  fileUrl: string;
  status: string;
  ocrText?: string;
  notes?: string;
  processedAt?: string;
  createdAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  prescription?: {
    id: string;
    medicationName: string;
    dosage: string;
    quantity: number;
    instructions?: string;
    prescriberName: string;
    issuedDate: string;
    expiryDate?: string;
  };
}

interface Consultation {
  id: string;
  type: string;
  status: string;
  scheduledDate: string;
  duration: number;
  notes?: string;
  meetingLink?: string;
  createdAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  pharmacist?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface VerificationFilters {
  status: string;
  dateFrom: string;
  dateTo: string;
  search: string;
}

export default function AdminPrescriptionVerification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUpload, setSelectedUpload] = useState<PrescriptionUpload | null>(null);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [verificationAction, setVerificationAction] = useState<'approve' | 'reject' | 'flag' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [filters, setFilters] = useState<VerificationFilters>({
    status: '',
    dateFrom: '',
    dateTo: '',
    search: ''
  });

  // Fetch prescription uploads
  const { data: prescriptionUploads, isLoading: uploadsLoading, refetch: refetchUploads } = useQuery<PrescriptionUpload[]>({
    queryKey: ["/api/admin/prescription-uploads", filters],
    enabled: user?.role === "admin" || user?.role === "pharmacist",
  });

  // Fetch consultations
  const { data: consultations, isLoading: consultationsLoading, refetch: refetchConsultations } = useQuery<Consultation[]>({
    queryKey: ["/api/admin/consultations", filters],
    enabled: user?.role === "admin" || user?.role === "pharmacist",
  });

  // Verify prescription upload mutation
  const verifyPrescriptionMutation = useMutation({
    mutationFn: async ({ 
      uploadId, 
      action, 
      notes, 
      prescriptionData 
    }: { 
      uploadId: string; 
      action: 'approve' | 'reject' | 'flag';
      notes?: string;
      prescriptionData?: any;
    }) => {
      return apiRequest('PATCH', `/api/admin/prescription-uploads/${uploadId}/verify`, {
        action,
        notes,
        prescriptionData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/prescription-uploads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Prescription verification updated successfully" });
      setSelectedUpload(null);
      setVerificationAction(null);
      setActionNotes('');
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update prescription verification", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Update consultation mutation
  const updateConsultationMutation = useMutation({
    mutationFn: async ({ consultationId, updates }: { consultationId: string; updates: any }) => {
      return apiRequest('PATCH', `/api/admin/consultations/${consultationId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/consultations"] });
      toast({ title: "Consultation updated successfully" });
      setSelectedConsultation(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update consultation", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Redirect if not authorized
  if (!user || (user.role !== "admin" && user.role !== "pharmacist")) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <CardContent className="text-center">
            <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-gray-600 mb-4">
              You need admin or pharmacist privileges to access prescription verification.
            </p>
            <Link href="/">
              <Button>Return to Homepage</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string, type: 'prescription' | 'consultation' = 'prescription') => {
    if (type === 'prescription') {
      const statusConfig = {
        pending: { color: "bg-orange-100 text-orange-800", label: "Pending Review" },
        processed: { color: "bg-blue-100 text-blue-800", label: "Processed" },
        approved: { color: "bg-green-100 text-green-800", label: "Approved" },
        rejected: { color: "bg-red-100 text-red-800", label: "Rejected" },
        flagged: { color: "bg-yellow-100 text-yellow-800", label: "Flagged for Review" }
      };
      const config = statusConfig[status as keyof typeof statusConfig] || { color: "bg-gray-100 text-gray-800", label: status };
      return (
        <Badge className={config.color}>
          {config.label}
        </Badge>
      );
    } else {
      const statusConfig = {
        scheduled: { color: "bg-blue-100 text-blue-800", label: "Scheduled" },
        in_progress: { color: "bg-yellow-100 text-yellow-800", label: "In Progress" },
        completed: { color: "bg-green-100 text-green-800", label: "Completed" },
        cancelled: { color: "bg-red-100 text-red-800", label: "Cancelled" }
      };
      const config = statusConfig[status as keyof typeof statusConfig] || { color: "bg-gray-100 text-gray-800", label: status };
      return (
        <Badge className={config.color}>
          {config.label}
        </Badge>
      );
    }
  };

  const handleVerificationAction = async (action: 'approve' | 'reject' | 'flag') => {
    if (!selectedUpload) return;
    
    verifyPrescriptionMutation.mutate({
      uploadId: selectedUpload.id,
      action,
      notes: actionNotes
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900" data-testid="text-prescription-verification-title">
                Prescription Verification & Consultations
              </h1>
              <p className="text-gray-600 mt-1">
                Review prescription uploads and manage consultations
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => { refetchUploads(); refetchConsultations(); }} 
                variant="outline" 
                className="flex items-center gap-2"
                data-testid="button-refresh-prescriptions"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Link href="/admin">
                <Button variant="outline" data-testid="button-back-admin">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="prescriptions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="prescriptions" data-testid="tab-prescriptions">
              <FileText className="h-4 w-4 mr-2" />
              Prescription Uploads
            </TabsTrigger>
            <TabsTrigger value="consultations" data-testid="tab-consultations">
              <MessageCircle className="h-4 w-4 mr-2" />
              Consultations
            </TabsTrigger>
          </TabsList>

          {/* Prescription Uploads Tab */}
          <TabsContent value="prescriptions" className="space-y-6">
            {/* Filters for Prescriptions */}
            <Card data-testid="card-prescription-filters">
              <CardHeader>
                <CardTitle>Filter Prescription Uploads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prescription-search">Search</Label>
                    <Input
                      id="prescription-search"
                      placeholder="Patient name, filename..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      data-testid="input-prescription-search"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prescription-status">Status</Label>
                    <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                      <SelectTrigger data-testid="select-prescription-status">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending Review</SelectItem>
                        <SelectItem value="processed">Processed</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="flagged">Flagged</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prescription-date-from">Date From</Label>
                    <Input
                      id="prescription-date-from"
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                      data-testid="input-prescription-date-from"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prescription-date-to">Date To</Label>
                    <Input
                      id="prescription-date-to"
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                      data-testid="input-prescription-date-to"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Prescription Uploads List */}
            <Card data-testid="card-prescriptions-list">
              <CardHeader>
                <CardTitle>Prescription Uploads ({prescriptionUploads?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                {uploadsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="animate-pulse">
                        <div className="h-24 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : prescriptionUploads?.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Prescription Uploads</h3>
                    <p className="text-gray-600">No prescription uploads match your current filters.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {prescriptionUploads?.map((upload) => (
                      <div
                        key={upload.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                        data-testid={`prescription-card-${upload.id}`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-start gap-4">
                            <div className="bg-blue-100 p-3 rounded-lg">
                              <ImageIcon className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg" data-testid={`text-prescription-filename-${upload.id}`}>
                                {upload.fileName}
                              </h3>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {upload.patient.firstName} {upload.patient.lastName}
                              </p>
                              <p className="text-xs text-gray-500">
                                Uploaded: {formatDate(upload.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="mb-2">{getStatusBadge(upload.status, 'prescription')}</div>
                            {upload.processedAt && (
                              <p className="text-xs text-gray-500">
                                Processed: {formatDate(upload.processedAt)}
                              </p>
                            )}
                          </div>
                        </div>

                        {upload.ocrText && (
                          <div className="bg-gray-50 p-3 rounded-lg mb-3">
                            <Label className="text-sm font-medium text-gray-700">Extracted Text:</Label>
                            <p className="text-sm text-gray-600 mt-1">{upload.ocrText}</p>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{upload.patient.email}</span>
                            {upload.patient.phone && <span>{upload.patient.phone}</span>}
                          </div>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => setSelectedUpload(upload)}
                                  data-testid={`button-view-prescription-${upload.id}`}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Review
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Prescription Review - {selectedUpload?.fileName}</DialogTitle>
                                  <DialogDescription>
                                    Review and verify the uploaded prescription
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedUpload && (
                                  <div className="space-y-6">
                                    {/* Patient Information */}
                                    <div>
                                      <h4 className="font-semibold mb-3">Patient Information</h4>
                                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                        <p><strong>Name:</strong> {selectedUpload.patient.firstName} {selectedUpload.patient.lastName}</p>
                                        <p><strong>Email:</strong> {selectedUpload.patient.email}</p>
                                        {selectedUpload.patient.phone && (
                                          <p><strong>Phone:</strong> {selectedUpload.patient.phone}</p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Prescription Image */}
                                    <div>
                                      <h4 className="font-semibold mb-3">Prescription Image</h4>
                                      <div className="border rounded-lg p-4">
                                        <img 
                                          src={selectedUpload.fileUrl} 
                                          alt="Prescription" 
                                          className="max-w-full h-auto rounded-lg"
                                          data-testid="img-prescription-preview"
                                        />
                                        <Button 
                                          size="sm" 
                                          variant="outline" 
                                          className="mt-3"
                                          onClick={() => window.open(selectedUpload.fileUrl, '_blank')}
                                          data-testid="button-view-fullsize"
                                        >
                                          <Download className="h-4 w-4 mr-2" />
                                          View Full Size
                                        </Button>
                                      </div>
                                    </div>

                                    {/* OCR Text */}
                                    {selectedUpload.ocrText && (
                                      <div>
                                        <h4 className="font-semibold mb-3">Extracted Text</h4>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                          <p className="whitespace-pre-wrap">{selectedUpload.ocrText}</p>
                                        </div>
                                      </div>
                                    )}

                                    {/* Verification Actions */}
                                    <div>
                                      <h4 className="font-semibold mb-3">Verification Actions</h4>
                                      <div className="space-y-4">
                                        <div>
                                          <Label htmlFor="verification-notes">Notes (Optional)</Label>
                                          <Textarea
                                            id="verification-notes"
                                            placeholder="Add notes about your verification decision..."
                                            value={actionNotes}
                                            onChange={(e) => setActionNotes(e.target.value)}
                                            data-testid="textarea-verification-notes"
                                          />
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                          <Button
                                            onClick={() => handleVerificationAction('approve')}
                                            disabled={verifyPrescriptionMutation.isPending}
                                            className="bg-green-600 hover:bg-green-700"
                                            data-testid="button-approve-prescription"
                                          >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Approve
                                          </Button>
                                          <Button
                                            onClick={() => handleVerificationAction('reject')}
                                            disabled={verifyPrescriptionMutation.isPending}
                                            variant="destructive"
                                            data-testid="button-reject-prescription"
                                          >
                                            <X className="h-4 w-4 mr-2" />
                                            Reject
                                          </Button>
                                          <Button
                                            onClick={() => handleVerificationAction('flag')}
                                            disabled={verifyPrescriptionMutation.isPending}
                                            className="bg-yellow-600 hover:bg-yellow-700"
                                            data-testid="button-flag-prescription"
                                          >
                                            <Flag className="h-4 w-4 mr-2" />
                                            Flag for Doctor Review
                                          </Button>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Current Notes */}
                                    {selectedUpload.notes && (
                                      <div>
                                        <h4 className="font-semibold mb-3">Previous Notes</h4>
                                        <p className="bg-gray-50 p-4 rounded-lg">{selectedUpload.notes}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Consultations Tab */}
          <TabsContent value="consultations" className="space-y-6">
            {/* Consultations List */}
            <Card data-testid="card-consultations-list">
              <CardHeader>
                <CardTitle>Consultations ({consultations?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                {consultationsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="animate-pulse">
                        <div className="h-20 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : consultations?.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Consultations</h3>
                    <p className="text-gray-600">No consultations scheduled at this time.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {consultations?.map((consultation) => (
                      <div
                        key={consultation.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                        data-testid={`consultation-card-${consultation.id}`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-start gap-4">
                            <div className="bg-purple-100 p-3 rounded-lg">
                              <MessageCircle className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg" data-testid={`text-consultation-type-${consultation.id}`}>
                                {consultation.type.replace('_', ' ').toUpperCase()}
                              </h3>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {consultation.patient.firstName} {consultation.patient.lastName}
                              </p>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(consultation.scheduledDate)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="mb-2">{getStatusBadge(consultation.status, 'consultation')}</div>
                            <p className="text-xs text-gray-500">
                              Duration: {consultation.duration} min
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{consultation.patient.email}</span>
                            {consultation.patient.phone && <span>{consultation.patient.phone}</span>}
                            {consultation.pharmacist && (
                              <span className="flex items-center gap-1">
                                <Stethoscope className="h-3 w-3" />
                                {consultation.pharmacist.firstName} {consultation.pharmacist.lastName}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {consultation.meetingLink && consultation.status === 'scheduled' && (
                              <Button 
                                size="sm" 
                                onClick={() => window.open(consultation.meetingLink, '_blank')}
                                data-testid={`button-join-meeting-${consultation.id}`}
                              >
                                <Video className="h-4 w-4 mr-1" />
                                Join Meeting
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedConsultation(consultation)}
                              data-testid={`button-manage-consultation-${consultation.id}`}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Manage
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
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