import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Eye, EyeOff, Hospital, Shield, ArrowLeft } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Check if user is already logged in
  const { data: user } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  // Redirect if already logged in
  if (user) {
    setLocation("/");
    return null;
  }

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      return apiRequest("POST", "/api/auth/login", data);
    },
    onSuccess: (data) => {
      toast({
        title: "Login Successful",
        description: "Welcome back to Luton Hospital Pharmacy!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid email or password",
      });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: { 
      email: string; 
      password: string; 
      firstName: string; 
      lastName: string; 
      phoneNumber?: string;
    }) => {
      return apiRequest("POST", "/api/auth/signup", data);
    },
    onSuccess: (data) => {
      toast({
        title: "Account Created",
        description: "Welcome to Luton Hospital Pharmacy!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: error.message || "Failed to create account",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields",
      });
      return;
    }

    if (!isLogin && (!firstName || !lastName)) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "First name and last name are required for signup",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Invalid Password",
        description: "Password must be at least 6 characters long",
      });
      return;
    }

    if (isLogin) {
      loginMutation.mutate({ email, password });
    } else {
      signupMutation.mutate({ 
        email, 
        password, 
        firstName, 
        lastName, 
        phoneNumber: phoneNumber || undefined 
      });
    }
  };

  const handleAdminLogin = () => {
    setLocation("/admin/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Card className="shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
              <Hospital className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                {isLogin ? "Welcome Back" : "Create Account"}
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                {isLogin 
                  ? "Sign in to your Luton Hospital Pharmacy account" 
                  : "Join Luton Hospital Pharmacy to manage your prescriptions"}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Security Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Secure {isLogin ? "Login" : "Registration"}</span>
              </div>
              <p className="text-xs text-blue-700">
                Your account is protected with secure authentication and encrypted data storage.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-gray-700">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      required={!isLogin}
                      data-testid="input-firstName"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-gray-700">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      required={!isLogin}
                      data-testid="input-lastName"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                  data-testid="input-email"
                />
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-gray-700">Phone Number (Optional)</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+254 700 000 000"
                    data-testid="input-phoneNumber"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    data-testid="input-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {!isLogin && (
                  <p className="text-xs text-gray-500">
                    Must be at least 6 characters long
                  </p>
                )}
              </div>

              <Button 
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold"
                disabled={loginMutation.isPending || signupMutation.isPending}
                data-testid="button-submit"
              >
                <Shield className="h-5 w-5 mr-2" />
                {(loginMutation.isPending || signupMutation.isPending) 
                  ? "Please wait..." 
                  : (isLogin ? "Sign In Securely" : "Create Account")}
              </Button>
            </form>

            <Separator />

            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsLogin(!isLogin)}
                className="text-green-600 hover:text-green-700 font-semibold"
                data-testid="button-toggle-form"
              >
                {isLogin 
                  ? "Don't have an account? Create Account" 
                  : "Already have an account? Sign In"}
              </Button>
            </div>

            {/* Features - Only show on login */}
            {isLogin && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900">What you can do:</h4>
                <div className="grid grid-cols-1 gap-2 text-xs text-gray-600">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Upload and manage prescriptions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Track your orders in real-time</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Book online consultations</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Access your medical history</span>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Navigation Links */}
            <div className="space-y-3">
              <div className="text-center">
                <span className="text-sm text-gray-600">Staff member? </span>
                <Button
                  onClick={handleAdminLogin}
                  variant="link"
                  className="text-red-600 hover:text-red-700 p-0 h-auto font-semibold"
                  data-testid="link-admin-login"
                >
                  Staff Portal
                </Button>
              </div>
              
              <div className="text-center">
                <Link href="/">
                  <Button 
                    variant="ghost" 
                    className="text-gray-600 hover:text-gray-800"
                    data-testid="link-back-to-homepage"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Homepage
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}