import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Eye, EyeOff, Shield, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function AdminResetPassword() {
  const [, setLocation] = useLocation();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Get token from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');
    
    if (!resetToken) {
      setIsValidToken(false);
      return;
    }
    
    setToken(resetToken);
    // We'll validate the token when user submits the form
    setIsValidToken(true);
  }, []);

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { token: string; password: string }) => {
      return apiRequest("POST", "/api/admin/reset-password", data);
    },
    onSuccess: () => {
      toast({
        title: "Admin Password Reset Successful",
        description: "Your admin password has been updated. You can now log in with your new password.",
      });
      
      // Redirect to admin login page after success
      setTimeout(() => {
        setLocation("/admin/login");
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Admin Password Reset Failed",
        description: error.message || "Invalid or expired admin reset token. Please request a new password reset.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      toast({
        title: "Invalid Reset Link",
        description: "No admin reset token found. Please check your email for the correct reset link.",
        variant: "destructive",
      });
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast({
        title: "Missing Information",
        description: "Please enter and confirm your new admin password",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Admin password must be at least 8 characters long for security.",
        variant: "destructive",
      });
      return;
    }

    resetPasswordMutation.mutate({ token, password: newPassword });
  };

  if (isValidToken === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-red-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Invalid Admin Reset Link
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                This admin password reset link is invalid or has expired
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Please request a new admin password reset from the admin login page.
            </p>
            <Button
              onClick={() => setLocation("/admin/login")}
              className="w-full bg-green-600 hover:bg-green-700"
              data-testid="button-back-to-admin-login"
            >
              Back to Admin Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Reset Admin Password
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Enter your new admin password below
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold">Admin Security Notice</p>
                <p className="mt-1">
                  You are resetting an administrative password. Use a strong, unique password for enhanced security.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Admin Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new admin password"
                  required
                  disabled={resetPasswordMutation.isPending}
                  data-testid="input-new-admin-password"
                  className="w-full pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={resetPasswordMutation.isPending}
                  data-testid="button-toggle-new-admin-password"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Admin Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new admin password"
                  required
                  disabled={resetPasswordMutation.isPending}
                  data-testid="input-confirm-admin-password"
                  className="w-full pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={resetPasswordMutation.isPending}
                  data-testid="button-toggle-confirm-admin-password"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={resetPasswordMutation.isPending}
              data-testid="button-reset-admin-password"
            >
              {resetPasswordMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating Admin Password...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Update Admin Password</span>
                </div>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              variant="link"
              onClick={() => setLocation("/admin/login")}
              className="text-sm text-gray-600 hover:text-gray-800"
              data-testid="link-back-to-admin-login"
            >
              ← Back to Admin Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}