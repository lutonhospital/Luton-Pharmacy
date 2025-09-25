import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import PatientDashboard from "@/components/PatientDashboard";
import StaffDashboard from "@/components/StaffDashboard";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isStaff = user?.role === 'pharmacist' || user?.role === 'admin';

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      {isStaff ? <StaffDashboard user={user!} /> : <PatientDashboard user={user!} />}
    </div>
  );
}
