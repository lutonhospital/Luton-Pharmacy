import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";
import { Link } from "wouter";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Privacy Policy</h1>
            <p className="text-xl text-gray-600">
              Your privacy and the security of your health information is our top priority
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-gray-800">Privacy Policy for Luton Hospital Online Pharmacy</CardTitle>
              <CardDescription>Last updated: September 2025</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              
              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Information We Collect</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Personal Information</h3>
                    <p className="text-gray-600 leading-relaxed">
                      We collect personal information such as your name, email address, phone number, address, and date of birth when you create an account or place an order.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Health Information</h3>
                    <p className="text-gray-600 leading-relaxed">
                      We collect health-related information including prescriptions, medical history, and consultation notes as necessary to provide pharmaceutical services.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Payment Information</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Payment details are processed securely through our trusted payment partners. We do not store complete credit card information on our servers.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">2. How We Use Your Information</h2>
                <div className="space-y-3 text-gray-600">
                  <p>• To process and fulfill your medication orders</p>
                  <p>• To provide pharmaceutical consultations and clinical services</p>
                  <p>• To verify prescriptions with healthcare providers</p>
                  <p>• To send order confirmations and delivery updates</p>
                  <p>• To comply with legal and regulatory requirements</p>
                  <p>• To improve our services and customer experience</p>
                  <p>• To send important health and safety communications</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">3. Information Sharing & Disclosure</h2>
                <div className="space-y-4">
                  <p className="text-gray-600 leading-relaxed">
                    We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
                  </p>
                  <div className="space-y-3 text-gray-600">
                    <p>• With healthcare providers to verify prescriptions</p>
                    <p>• With delivery partners to fulfill orders (limited to delivery information only)</p>
                    <p>• With payment processors for secure transaction processing</p>
                    <p>• When required by law or to comply with legal obligations</p>
                    <p>• To protect the safety and security of our patients and staff</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">4. Data Security</h2>
                <div className="space-y-3 text-gray-600">
                  <p>• All data is encrypted in transit and at rest using industry-standard encryption</p>
                  <p>• Access to personal information is restricted to authorized personnel only</p>
                  <p>• Regular security audits and vulnerability assessments are conducted</p>
                  <p>• Secure backup systems ensure data availability and integrity</p>
                  <p>• Staff are trained on data protection and confidentiality requirements</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">5. Your Rights</h2>
                <div className="space-y-3 text-gray-600">
                  <p>• <strong>Access:</strong> Request copies of your personal information</p>
                  <p>• <strong>Correction:</strong> Request corrections to inaccurate information</p>
                  <p>• <strong>Deletion:</strong> Request deletion of your personal data (subject to legal requirements)</p>
                  <p>• <strong>Portability:</strong> Request transfer of your data to another provider</p>
                  <p>• <strong>Opt-out:</strong> Unsubscribe from marketing communications</p>
                  <p>• <strong>Complaints:</strong> Lodge complaints with the Data Protection Commissioner</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">6. Cookies & Website Analytics</h2>
                <p className="text-gray-600 leading-relaxed">
                  We use cookies to enhance your browsing experience, remember your preferences, and analyze website traffic. You can control cookie settings through your browser preferences. Essential cookies required for website functionality cannot be disabled.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">7. Data Retention</h2>
                <p className="text-gray-600 leading-relaxed">
                  We retain your personal information for as long as necessary to provide services and comply with legal obligations. Medical records are retained in accordance with Kenyan healthcare regulations. You may request deletion of your data subject to these requirements.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">8. Children's Privacy</h2>
                <p className="text-gray-600 leading-relaxed">
                  Our services are not intended for children under 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">9. Contact Us</h2>
                <div className="space-y-2 text-gray-600">
                  <p>For privacy-related questions or to exercise your rights, contact:</p>
                  <p><strong>Data Protection Officer</strong></p>
                  <p>Luton Hospital Online Pharmacy</p>
                  <p>Ngong Road, Nairobi, Kenya</p>
                  <p>Phone: 0111 003400</p>
                  <p>Email: privacy@lutonhospital.co.ke</p>
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