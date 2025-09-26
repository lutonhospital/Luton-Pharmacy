import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Eye, Calendar, User, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

interface Prescription {
  id: string;
  patientName: string;
  doctorName: string;
  medications: string[];
  instructions: string;
  status: 'pending_verification' | 'verified' | 'dispensed' | 'rejected';
  imageUrl?: string;
  notes?: string;
  createdAt: string;
  verifiedAt?: string;
  pharmacistNotes?: string;
}

export default function Prescriptions() {
  const { user, isAuthenticated } = useAuth();

  const { data: prescriptions, isLoading } = useQuery<Prescription[]>({
    queryKey: ["/api/prescriptions"],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <CardContent className="text-center">
            <h2 className="text-xl font-semibold mb-2">Please Login</h2>
            <p className="text-gray-600">You need to be logged in to view your prescriptions.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_verification': return 'bg-yellow-100 text-yellow-800';
      case 'verified': return 'bg-blue-100 text-blue-800';
      case 'dispensed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_verification': return <Clock className="h-4 w-4" />;
      case 'verified': return <CheckCircle className="h-4 w-4" />;
      case 'dispensed': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <AlertTriangle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending_verification': return 'Pending Verification';
      case 'verified': return 'Verified';
      case 'dispensed': return 'Dispensed';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="text-prescriptions-title">My Prescriptions</h1>
            <p className="text-gray-600 mt-2">View and manage your prescription uploads</p>
          </div>
          <Link href="/prescription-upload">
            <Button data-testid="button-upload-prescription">
              <Upload className="h-4 w-4 mr-2" />
              Upload New Prescription
            </Button>
          </Link>
        </div>

        {!prescriptions || prescriptions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Prescriptions Yet</h3>
              <p className="text-gray-600 mb-6">
                You haven't uploaded any prescriptions yet. Upload your first prescription to get started.
              </p>
              <Link href="/prescription-upload">
                <Button data-testid="button-upload-first-prescription">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Prescription
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {prescriptions.map((prescription) => (
              <Card key={prescription.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                    <div>
                      <CardTitle className="text-lg">Prescription #{prescription.id.slice(-8)}</CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-4 mt-1">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(prescription.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          Dr. {prescription.doctorName}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(prescription.status)} data-testid={`status-${prescription.status}`}>
                      {getStatusIcon(prescription.status)}
                      <span className="ml-1">{getStatusText(prescription.status)}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Prescription Details */}
                    <div className="lg:col-span-2">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Patient Information</h4>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="font-medium" data-testid={`patient-name-${prescription.id}`}>
                              {prescription.patientName}
                            </p>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Prescribed Medications</h4>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <ul className="space-y-1">
                              {prescription.medications.map((medication, index) => (
                                <li key={index} className="text-sm" data-testid={`medication-${index}`}>
                                  • {medication}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Instructions</h4>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm" data-testid={`instructions-${prescription.id}`}>
                              {prescription.instructions}
                            </p>
                          </div>
                        </div>

                        {prescription.pharmacistNotes && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Pharmacist Notes</h4>
                            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                              <p className="text-sm text-blue-800" data-testid={`pharmacist-notes-${prescription.id}`}>
                                {prescription.pharmacistNotes}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Prescription Image & Actions */}
                    <div>
                      <div className="space-y-4">
                        {prescription.imageUrl && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Prescription Image</h4>
                            <div className="bg-gray-100 p-3 rounded-lg">
                              <img
                                src={prescription.imageUrl}
                                alt="Prescription"
                                className="w-full h-32 object-cover rounded-md"
                                data-testid={`prescription-image-${prescription.id}`}
                              />
                            </div>
                          </div>
                        )}

                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Verification Status</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Uploaded:</span>
                              <span className="text-green-600">✓</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>Reviewed:</span>
                              <span className={prescription.status !== 'pending_verification' ? 'text-green-600' : 'text-gray-400'}>
                                {prescription.status !== 'pending_verification' ? '✓' : '○'}
                              </span>
                            </div>
                            {prescription.verifiedAt && (
                              <div className="text-xs text-gray-500 mt-2">
                                Verified on {new Date(prescription.verifiedAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          {prescription.imageUrl && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                              onClick={() => window.open(prescription.imageUrl, '_blank')}
                              data-testid={`button-view-${prescription.id}`}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Original
                            </Button>
                          )}
                          {prescription.status === 'verified' && (
                            <Link href="/shop">
                              <Button size="sm" className="w-full" data-testid={`button-order-${prescription.id}`}>
                                Order Medications
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}