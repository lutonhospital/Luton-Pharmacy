import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  MapPin, 
  Search, 
  User as UserIcon, 
  Heart, 
  ShoppingCart,
  Upload,
  ChevronDown,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Linkedin
} from "lucide-react";
import logoPath from "@assets/Logo_1758790009017.png";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Link, useLocation } from "wouter";
import type { User } from "@shared/schema";

interface NavigationProps {
  user?: User;
}

export default function Navigation({ user }: NavigationProps) {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("Nairobi, Kenya");

  const userInitials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` || 'U' : 'G';

  const navigationLinks = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <div className="w-full">
      {/* Top Header Bar */}
      <div className="bg-primary text-white py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>Licensed Pharmacy - License #PH2024/KE/001</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>info@lutonhospital.co.ke</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-xs">Follow Us:</span>
              <div className="flex space-x-2">
                <Button variant="ghost" size="icon" className="h-6 w-6 p-0 text-white hover:text-primary hover:bg-white" data-testid="social-facebook">
                  <Facebook className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 p-0 text-white hover:text-primary hover:bg-white" data-testid="social-twitter">
                  <Twitter className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 p-0 text-white hover:text-primary hover:bg-white" data-testid="social-instagram">
                  <Instagram className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 p-0 text-white hover:text-primary hover:bg-white" data-testid="social-linkedin">
                  <Linkedin className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo and Location */}
            <div className="flex items-center space-x-6">
              <Link href="/">
                <div className="cursor-pointer flex items-center">
                  <img 
                    src={logoPath} 
                    alt="Luton Hospital Logo" 
                    className="h-16 w-auto object-contain" 
                    style={{ maxWidth: '200px' }}
                  />
                </div>
              </Link>
              
              {/* Location Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-2" data-testid="button-location">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-sm">{selectedLocation}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSelectedLocation("Nairobi, Kenya")}>
                    Nairobi, Kenya
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedLocation("Mombasa, Kenya")}>
                    Mombasa, Kenya
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedLocation("Kisumu, Kenya")}>
                    Kisumu, Kenya
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-xl mx-8">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search for medicines, health products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 border-2 border-gray-200 rounded-lg focus:border-primary"
                  data-testid="input-search"
                />
                <Button 
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  data-testid="button-search"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Navigation Icons */}
            <div className="flex items-center space-x-6">
              {/* Upload Prescription */}
              <Link href="/upload-prescription">
                <Button variant="ghost" className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-primary" data-testid="nav-upload-prescription">
                  <Upload className="h-4 w-4" />
                  <span>Upload Prescription</span>
                </Button>
              </Link>

              {/* Account */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2" data-testid="button-account">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-primary text-white text-xs">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">Account</p>
                        <p className="text-xs text-gray-500">{user.firstName}</p>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Link href="/profile">My Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/orders">My Orders</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/prescriptions">My Prescriptions</Link>
                    </DropdownMenuItem>
                    {(user.role === 'admin' || user.role === 'pharmacist') && (
                      <DropdownMenuItem>
                        <Link href="/admin">Admin Dashboard</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => window.location.href = '/api/logout'}>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  variant="ghost" 
                  onClick={() => window.location.href = '/api/login'}
                  className="flex items-center space-x-2"
                  data-testid="button-login"
                >
                  <UserIcon className="h-5 w-5" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Account</p>
                    <p className="text-xs text-gray-500">Sign In</p>
                  </div>
                </Button>
              )}

              {/* Wishlist */}
              <Button variant="ghost" className="relative" data-testid="button-wishlist">
                <Heart className="h-6 w-6 text-gray-600 hover:text-primary" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  0
                </span>
                <div className="hidden lg:block ml-2">
                  <p className="text-sm font-medium text-gray-700">Wishlist</p>
                </div>
              </Button>

              {/* Cart */}
              <Button variant="ghost" className="relative" data-testid="button-cart">
                <ShoppingCart className="h-6 w-6 text-gray-600 hover:text-primary" />
                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  0
                </span>
                <div className="hidden lg:block ml-2">
                  <p className="text-sm font-medium text-gray-700">Cart</p>
                  <p className="text-xs text-gray-500">KES 0</p>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-8 h-12">
            {navigationLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button 
                  variant="ghost" 
                  className={`text-sm font-medium transition-colors h-12 px-4 ${
                    location === link.href 
                      ? "text-primary bg-primary/10 border-b-2 border-primary" 
                      : "text-gray-700 hover:text-primary"
                  }`}
                  data-testid={`nav-${link.label.toLowerCase().replace(" ", "-")}`}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}