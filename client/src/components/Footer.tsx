import { Link } from "wouter";
import { useState } from "react";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Truck,
  Shield,
  CreditCard,
  Headphones,
  Smartphone,
  Award,
  Newspaper
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logoPath from "@assets/Logo_1758790009017.png";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement newsletter subscription
    console.log("Newsletter subscription:", email);
    setEmail("");
  };

  return (
    <footer className="bg-gray-900 text-white">
      {/* Why Shop With Us Section */}
      <div className="bg-primary py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Why Shop With Us</h2>
            <p className="text-white/90">Kenya's most trusted online pharmacy</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center" data-testid="feature-express-shipping">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                <Truck className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">Express Shipping</h3>
              <p className="text-sm text-white/90">Shipping all over Kenya</p>
            </div>
            <div className="text-center" data-testid="feature-satisfaction">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">100% Satisfaction</h3>
              <p className="text-sm text-white/90">Money back guarantee</p>
            </div>
            <div className="text-center" data-testid="feature-secure-payments">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">Secure Payments</h3>
              <p className="text-sm text-white/90">Protected by encryption</p>
            </div>
            <div className="text-center" data-testid="feature-support">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                <Headphones className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">24/7 Support</h3>
              <p className="text-sm text-white/90">Always here to help you</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center space-x-3">
                <img src={logoPath} alt="Luton Hospital Logo" className="h-10 w-auto" />
                <div>
                  <h3 className="text-lg font-semibold">Luton Hospital</h3>
                  <p className="text-sm text-gray-400">Online Pharmacy</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Kenya's leading online pharmacy delivering quality medicines and healthcare products 
                to your doorstep. Licensed and trusted by thousands of customers nationwide.
              </p>
              
              {/* Social Media */}
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-primary transition-colors" data-testid="social-facebook">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-primary transition-colors" data-testid="social-twitter">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-primary transition-colors" data-testid="social-instagram">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-primary transition-colors" data-testid="social-linkedin">
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Shop on The Go */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Shop on The Go</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Smartphone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Mobile App</p>
                    <p className="text-xs text-gray-400">Coming Soon</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  Download our mobile app for easy ordering and prescription management on the go.
                </p>
              </div>
            </div>

            {/* Support */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Support</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Mail className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Email Support</p>
                    <a href="mailto:info@lutonhospital.co.ke" className="text-xs text-gray-400 hover:text-primary">
                      info@lutonhospital.co.ke
                    </a>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Phone className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Phone Support</p>
                    <a href="tel:0111003400" className="text-xs text-gray-400 hover:text-primary">
                      0111 003400
                    </a>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Headphones className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Customer Service</p>
                    <p className="text-xs text-gray-400">24/7 dedicated support</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact & Location */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Head Office</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                  <div className="text-sm text-gray-400">
                    <p>Ngong Road, Nairobi</p>
                    <p>Kenya</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                  <div className="text-sm text-gray-400">
                    <p>Open 24 Hours</p>
                    <p>7 Days a Week</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Newsletter Section */}
          <div className="border-t border-gray-800 mt-8 pt-8">
            <div className="max-w-md mx-auto text-center">
              <div className="flex items-center justify-center space-x-2 mb-3">
                <Newspaper className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Join Our Newsletter</h3>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Subscribe now and stay updated with exclusive offers, new product launches, and more!
              </p>
              <form onSubmit={handleNewsletterSubmit} className="flex space-x-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                  data-testid="input-newsletter-email"
                />
                <Button type="submit" className="bg-primary hover:bg-primary/90" data-testid="button-newsletter-subscribe">
                  Subscribe
                </Button>
              </form>
            </div>
          </div>

          {/* Health Insights & Quick Links */}
          <div className="border-t border-gray-800 mt-8 pt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Health Insights & Updates</h3>
              <p className="text-sm text-gray-400 mb-4">
                Stay informed with the latest research, health tips, and pharmaceutical advancements from our expert team.
              </p>
              <Link href="/news">
                <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-primary hover:border-primary" data-testid="button-health-insights">
                  Read Health Articles
                </Button>
              </Link>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Link href="/"><span className="text-gray-400 hover:text-primary cursor-pointer">Home</span></Link>
                <Link href="/shop"><span className="text-gray-400 hover:text-primary cursor-pointer">Shop</span></Link>
                <Link href="/upload-prescription"><span className="text-gray-400 hover:text-primary cursor-pointer">Upload Prescription</span></Link>
                <Link href="/consultation"><span className="text-gray-400 hover:text-primary cursor-pointer">Online Consultation</span></Link>
                <Link href="/track-order"><span className="text-gray-400 hover:text-primary cursor-pointer">Track Order</span></Link>
                <Link href="/contact"><span className="text-gray-400 hover:text-primary cursor-pointer">Contact Us</span></Link>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-800 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-sm text-gray-400">
                © {currentYear} Luton Hospital Pharmacy. All rights reserved.
              </div>
              <div className="flex flex-wrap justify-center space-x-6 text-sm">
                <Link href="/privacy">
                  <span className="text-gray-400 hover:text-primary transition-colors cursor-pointer">
                    Privacy Policy
                  </span>
                </Link>
                <Link href="/terms">
                  <span className="text-gray-400 hover:text-primary transition-colors cursor-pointer">
                    Terms of Service
                  </span>
                </Link>
                <span className="text-gray-400">
                  Licensed by Pharmacy and Poisons Board of Kenya
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}