import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Hospital, User, ArrowLeft, Shield } from "lucide-react";
import { Link } from "wouter";

export default function Login() {
  const [email, setEmail] = useState("");

  const handleReplitLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
            <Hospital className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Sign in to your Luton Hospital Pharmacy account
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Quick Access Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Secure Login</span>
            </div>
            <p className="text-xs text-blue-700">
              Your account is protected with secure authentication. Click below to sign in safely.
            </p>
          </div>

          {/* Email field for display/reference (not functional) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
              data-testid="input-email"
            />
            <p className="text-xs text-gray-500">
              This will be used to identify your account during secure login
            </p>
          </div>

          <Separator />

          {/* Secure Login Button */}
          <Button
            onClick={handleReplitLogin}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold"
            data-testid="button-secure-login"
          >
            <Shield className="h-5 w-5 mr-2" />
            Continue with Secure Login
          </Button>

          {/* Features */}
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

          <Separator />

          {/* Navigation Links */}
          <div className="space-y-3">
            <div className="text-center">
              <span className="text-sm text-gray-600">Don't have an account? </span>
              <Link href="/signup">
                <Button variant="link" className="text-green-600 hover:text-green-700 p-0 h-auto font-semibold" data-testid="link-signup">
                  Create Account
                </Button>
              </Link>
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
  );
}