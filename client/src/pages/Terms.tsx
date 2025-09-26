import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import { Link } from "wouter";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <FileText className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Terms & Conditions</h1>
            <p className="text-xl text-gray-600">
              Please read these terms and conditions carefully before using our services
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-gray-800">Terms & Conditions for Luton Hospital Online Pharmacy</CardTitle>
              <CardDescription>Last updated: September 2025</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              
              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-600 leading-relaxed">
                  By accessing and using the Luton Hospital Online Pharmacy website and services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree with any part of these terms, you may not use our services.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">2. Medical Services & Prescription Requirements</h2>
                <div className="space-y-3 text-gray-600">
                  <p>• All prescription medications require a valid prescription from a licensed healthcare provider.</p>
                  <p>• We reserve the right to verify prescriptions with the prescribing physician.</p>
                  <p>• Prescription medications will only be dispensed after verification and approval by our licensed pharmacists.</p>
                  <p>• We comply with all Kenyan pharmaceutical regulations and licensing requirements.</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">3. User Account & Responsibilities</h2>
                <div className="space-y-3 text-gray-600">
                  <p>• You are responsible for maintaining the confidentiality of your account information.</p>
                  <p>• You must provide accurate and complete information when creating an account.</p>
                  <p>• You agree to notify us immediately of any unauthorized use of your account.</p>
                  <p>• You must be at least 18 years old to create an account or use our services.</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">4. Orders & Payment</h2>
                <div className="space-y-3 text-gray-600">
                  <p>• All orders are subject to availability and acceptance by Luton Hospital.</p>
                  <p>• Prices are subject to change without notice.</p>
                  <p>• Payment must be made in full before order processing.</p>
                  <p>• We accept cash on delivery, M-Pesa, and card payments.</p>
                  <p>• Delivery charges may apply based on location within Kenya.</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">5. Privacy & Data Protection</h2>
                <p className="text-gray-600 leading-relaxed">
                  We are committed to protecting your privacy and personal health information. All patient data is handled in accordance with Kenyan data protection laws and medical confidentiality requirements. For detailed information, please refer to our Privacy Policy.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">6. Delivery & Returns</h2>
                <div className="space-y-3 text-gray-600">
                  <p>• We deliver throughout Kenya via our trusted courier partners.</p>
                  <p>• Delivery times may vary based on location and product availability.</p>
                  <p>• Prescription medications cannot be returned once delivered due to safety regulations.</p>
                  <p>• Over-the-counter products may be returned within 14 days if unopened and in original packaging.</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">7. Limitation of Liability</h2>
                <p className="text-gray-600 leading-relaxed">
                  Luton Hospital Online Pharmacy shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use of our services. Our total liability shall not exceed the amount paid for the specific product or service in question.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">8. Governing Law</h2>
                <p className="text-gray-600 leading-relaxed">
                  These terms and conditions are governed by and construed in accordance with the laws of Kenya. Any disputes arising from the use of our services shall be subject to the jurisdiction of Kenyan courts.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">9. Contact Information</h2>
                <div className="space-y-2 text-gray-600">
                  <p><strong>Luton Hospital Online Pharmacy</strong></p>
                  <p>Ngong Road, Nairobi, Kenya</p>
                  <p>Phone: 0111 003400</p>
                  <p>Email: info@lutonhospital.co.ke</p>
                </div>
              </section>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <Link href="/">
                  <Button variant="outline" className="flex items-center gap-2" data-testid="button-back-home">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Homepage
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}