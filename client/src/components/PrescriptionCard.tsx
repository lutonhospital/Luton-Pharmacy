import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pill, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface PrescriptionCardProps {
  prescription: any;
  isPatientView: boolean;
  onApprove?: () => void;
  onReject?: () => void;
}

export default function PrescriptionCard({ 
  prescription, 
  isPatientView, 
  onApprove, 
  onReject 
}: PrescriptionCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready_for_pickup":
        return <CheckCircle className="h-4 w-4 text-accent" />;
      case "pending_review":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-primary" />;
      default:
        return <Pill className="h-4 w-4 text-primary" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ready_for_pickup":
        return <Badge className="bg-accent/10 text-accent">Ready for Pickup</Badge>;
      case "pending_review":
        return <Badge variant="destructive">Pending Review</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>;
      case "approved":
        return <Badge className="bg-accent/10 text-accent">Approved</Badge>;
      case "dispensed":
        return <Badge className="bg-accent/10 text-accent">Dispensed</Badge>;
      default:
        return <Badge variant="secondary">{status.replace('_', ' ')}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  return (
    <Card className={`${prescription.status === 'pending_review' && !isPatientView ? 'border-l-4 border-l-destructive bg-destructive/5' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              {getStatusIcon(prescription.status)}
            </div>
            <div>
              <h4 className="font-medium text-foreground">{prescription.medicationName}</h4>
              <p className="text-sm text-muted-foreground">{prescription.dosage}</p>
              <p className="text-sm text-muted-foreground">
                Quantity: {prescription.quantity}
              </p>
              {!isPatientView && (
                <>
                  <p className="text-sm text-muted-foreground">
                    Patient: {prescription.patientId.slice(-8)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Prescribed by: Dr. {prescription.prescriberName}
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="text-right">
            {getStatusBadge(prescription.status)}
            <p className="text-sm text-muted-foreground mt-1">
              Issued: {formatDate(prescription.issuedDate)}
            </p>
            {prescription.lastFilledDate && (
              <p className="text-sm text-muted-foreground">
                Last filled: {formatDate(prescription.lastFilledDate)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Refills remaining: <span className="font-medium text-foreground">{prescription.refillsRemaining}</span>
          </div>
          <div className="flex space-x-2">
            {isPatientView ? (
              <>
                <Button variant="ghost" size="sm" data-testid={`button-view-details-${prescription.id}`}>
                  View Details
                </Button>
                {prescription.status === "approved" && (
                  <Button size="sm" data-testid={`button-reorder-${prescription.id}`}>
                    Reorder
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" data-testid={`button-patient-history-${prescription.id}`}>
                  Patient History
                </Button>
                {prescription.status === "pending_review" && (
                  <>
                    <Button 
                      size="sm" 
                      onClick={onApprove}
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                      data-testid={`button-approve-${prescription.id}`}
                    >
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={onReject}
                      data-testid={`button-reject-${prescription.id}`}
                    >
                      Request Clarification
                    </Button>
                  </>
                )}
                {prescription.status === "approved" && (
                  <Button 
                    size="sm"
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                    data-testid={`button-mark-ready-${prescription.id}`}
                  >
                    Mark Ready
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
