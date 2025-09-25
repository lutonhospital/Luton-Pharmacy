import { Link } from "wouter";
import { 
  Hospital, 
  MapPin, 
  Phone, 
  Mail, 
  Clock,
  Facebook,
  Twitter,
  Instagram,
  Linkedin
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
  ];

  const services = [
    { href: "/prescription-upload", label: "Prescription Upload" },
    { href: "/consultation", label: "Online Consultation" },
    { href: "/dashboard", label: "Patient Portal" },
    { href: "/shop", label: "Medicine Catalog" },
  ];

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Hospital Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Hospital className="text-primary h-6 w-6" />
              <span className="text-lg font-semibold">Luton Hospital Pharmacy</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Your trusted healthcare partner, providing quality pharmaceutical 
              services and exceptional patient care in Nairobi.
            </p>
            
            {/* Social Media Links */}
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="text-muted-foreground hover:text-primary transition-colors"
                data-testid="link-facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-primary transition-colors"
                data-testid="link-twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-primary transition-colors"
                data-testid="link-instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-primary transition-colors"
                data-testid="link-linkedin"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <nav className="space-y-2">
              {quickLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <span className="block text-muted-foreground hover:text-primary transition-colors text-sm cursor-pointer">
                    {link.label}
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Our Services</h3>
            <nav className="space-y-2">
              {services.map((service) => (
                <Link key={service.href} href={service.href}>
                  <span className="block text-muted-foreground hover:text-primary transition-colors text-sm cursor-pointer">
                    {service.label}
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <p>China Centre Mall</p>
                  <p>China Centre, Ngong Rd</p>
                  <p>Nairobi, Kenya</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                <a 
                  href="tel:0111003400" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  0111 003400
                </a>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <a 
                  href="mailto:info@lutonhospital.co.ke" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  info@lutonhospital.co.ke
                </a>
              </div>
              
              <div className="flex items-start space-x-3">
                <Clock className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <p>Open 24 Hours</p>
                  <p>7 Days a Week</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-muted-foreground">
              © {currentYear} Luton Hospital Pharmacy. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <Link href="/privacy">
                <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  Privacy Policy
                </span>
              </Link>
              <Link href="/terms">
                <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  Terms of Service
                </span>
              </Link>
              <span className="text-muted-foreground">
                Licensed by Pharmacy and Poisons Board of Kenya
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}