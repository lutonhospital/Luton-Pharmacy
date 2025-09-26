import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Hospital, UserPlus, ArrowLeft, Shield, CheckCircle } from "lucide-react";
import { Link } from "wouter";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleReplitSignup = () => {
    if (!agreeTerms) {
      alert("Please agree to the terms and conditions to continue.");
      return;
    }
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
              Join Luton Hospital
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Create your pharmacy account to get started
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Benefits Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">Free Account Benefits</span>
            </div>
            <p className="text-xs text-green-700">
              Access to prescription management, online consultations, and order tracking.
            </p>
          </div>

          {/* User Information Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="firstName" className="text-gray-700 text-sm">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full"
                  data-testid="input-first-name"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lastName" className="text-gray-700 text-sm">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full"
                  data-testid="input-last-name"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-gray-700 text-sm">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                data-testid="input-email"
              />
              <p className="text-xs text-gray-500">
                We'll use this for account verification and important updates
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="phoneNumber" className="text-gray-700 text-sm">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+254 700 123 456"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full"
                data-testid="input-phone-number"
              />
              <p className="text-xs text-gray-500">
                Required for SMS notifications and order updates
              </p>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms"
              checked={agreeTerms}
              onCheckedChange={(checked) => setAgreeTerms(checked === true)}
              className="mt-1"
              data-testid="checkbox-agree-terms"
            />
            <div className="text-xs text-gray-600 leading-relaxed">
              <Label htmlFor="terms" className="cursor-pointer">
                I agree to the{" "}
                <Link href="/terms" className="text-green-600 hover:text-green-700 underline">
                  Terms & Conditions
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-green-600 hover:text-green-700 underline">
                  Privacy Policy
                </Link>.
                I understand that my health information will be handled in accordance with HIPAA regulations.
              </Label>
            </div>
          </div>

          <Separator />

          {/* Create Account Button */}
          <Button
            onClick={handleReplitSignup}
            disabled={!agreeTerms}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-3 text-lg font-semibold"
            data-testid="button-create-account"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Create Account Securely
          </Button>

          {/* What Happens Next */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">What happens next:</h4>
            <div className="grid grid-cols-1 gap-2 text-xs text-gray-600">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                <span>Secure account verification via email</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                <span>Complete your health profile setup</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                <span>Start uploading prescriptions and ordering</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Navigation Links */}
          <div className="space-y-3">
            <div className="text-center">
              <span className="text-sm text-gray-600">Already have an account? </span>
              <Link href="/login">
                <Button variant="link" className="text-green-600 hover:text-green-700 p-0 h-auto font-semibold" data-testid="link-login">
                  Sign In
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