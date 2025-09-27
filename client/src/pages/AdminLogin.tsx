import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Shield, Eye, EyeOff, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/admin/login", credentials);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Login Successful",
        description: "Welcome to Luton Hospital Admin Dashboard",
      });
      
      // Invalidate queries and force refetch
      queryClient.invalidateQueries({ queryKey: ["/api/admin/auth/user"] });
      queryClient.refetchQueries({ queryKey: ["/api/admin/auth/user"] });
      
      // Wait for authentication state to update before redirecting
      setTimeout(() => {
        setLocation("/admin");
      }, 500);
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      return apiRequest("POST", "/api/admin/forgot-password", data);
    },
    onSuccess: () => {
      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for admin password reset instructions.",
      });
      setShowForgotPassword(false);
      setForgotPasswordEmail("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: error.message || "Failed to send admin password reset email",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({
        title: "Missing Credentials",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate({ username, password });
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail) {
      toast({
        variant: "destructive",
        title: "Missing Email",
        description: "Please enter your admin email address",
      });
      return;
    }

    forgotPasswordMutation.mutate({ email: forgotPasswordEmail });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Admin Portal
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Luton Hospital Pharmacy Management System
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                required
                disabled={loginMutation.isPending}
                data-testid="input-admin-username"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                  disabled={loginMutation.isPending}
                  data-testid="input-admin-password"
                  className="w-full pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loginMutation.isPending}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? (
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
              disabled={loginMutation.isPending}
              data-testid="button-admin-login"
            >
              {loginMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                "Sign In to Admin Panel"
              )}
            </Button>
          </form>

          <Separator className="my-4" />

          {/* Forgot Password Dialog */}
          <div className="text-center">
            <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="link"
                  className="text-sm text-gray-600 hover:text-gray-800 p-0 h-auto"
                  data-testid="button-admin-forgot-password"
                >
                  Forgot your admin password?
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span>Reset Admin Password</span>
                  </DialogTitle>
                  <DialogDescription>
                    Enter your admin email address and we'll send you a link to reset your password.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminForgotEmail">Admin Email Address</Label>
                    <Input
                      id="adminForgotEmail"
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      placeholder="Enter your admin email address"
                      required
                      data-testid="input-admin-forgot-email"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForgotPassword(false)}
                      data-testid="button-admin-cancel-forgot"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={forgotPasswordMutation.isPending}
                      data-testid="button-admin-send-reset"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold">Admin Access Only</p>
                <p className="mt-1">
                  This portal is restricted to authorized pharmacy staff and administrators only.
                  Unauthorized access is strictly prohibited.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => setLocation("/")}
              className="text-sm text-gray-600 hover:text-gray-800"
              data-testid="link-back-to-homepage"
            >
              ← Back to Customer Portal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}