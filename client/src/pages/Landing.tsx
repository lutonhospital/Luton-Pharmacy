import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Hospital, Shield, Clock, Smartphone } from "lucide-react";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Hospital className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">Luton Hospital Pharmacy</h1>
            </div>
            <Button 
              onClick={() => setLocation('/login')}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-login"
            >
              Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Your Online Pharmacy Portal
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Manage your prescriptions, track orders, and access pharmacy services securely 
            through our HIPAA-compliant online platform.
          </p>
          <Button 
            size="lg" 
            onClick={() => setLocation('/login')}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            data-testid="button-get-started"
          >
            Get Started
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Complete Pharmacy Management
            </h3>
            <p className="text-xl text-muted-foreground">
              Everything you need to manage your medications and prescriptions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Hospital className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Prescription Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  View active prescriptions, request refills, and track your medication history
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Real-time Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Get instant updates on prescription status and pickup notifications
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Secure & Compliant</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  HIPAA-compliant platform with encrypted data and secure payment processing
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Mobile Friendly</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Access your pharmacy services from any device, anywhere, anytime
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Ready to get started?
          </h3>
          <p className="text-xl text-muted-foreground mb-8">
            Login with your NHS credentials to access your pharmacy portal
          </p>
          <Button 
            size="lg" 
            onClick={() => setLocation('/login')}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            data-testid="button-login-cta"
          >
            Access Your Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Hospital className="h-6 w-6 text-primary" />
              <span className="text-sm text-muted-foreground">
                © 2024 Luton Hospital Pharmacy. All rights reserved.
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Contact: pharmacy@lutonhospital.nhs.uk | 01582 491122
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
