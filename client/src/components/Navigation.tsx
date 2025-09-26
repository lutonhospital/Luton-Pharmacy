import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/useCart";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  Linkedin,
  Menu,
  X
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
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("Nairobi, Kenya");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { cartCount, cartTotal } = useCart();

  const userInitials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` || 'U' : 'G';

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: error.message || "Failed to logout",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navigationLinks = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <div className="w-full">
      {/* Top Header Bar */}
      <div className="bg-primary text-white py-2 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span className="hidden lg:inline">Licensed Pharmacy - License #PH2024/KE/001</span>
                <span className="lg:hidden">Licensed Pharmacy</span>
              </div>
              <div className="flex items-center space-x-2 hidden lg:flex">
                <Mail className="h-4 w-4" />
                <span>info@lutonhospital.co.ke</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-xs hidden lg:inline">Follow Us:</span>
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
          <div className="flex justify-between items-center h-16 lg:h-20">
            {/* Mobile Menu Button & Logo */}
            <div className="flex items-center space-x-4">
              {/* Hamburger Menu - Mobile Only */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
                data-testid="button-mobile-menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
              
              {/* Logo */}
              <Link href="/">
                <div className="cursor-pointer flex items-center">
                  <img 
                    src={logoPath} 
                    alt="Luton Hospital Logo" 
                    className="h-12 lg:h-16 w-auto object-contain" 
                    style={{ maxWidth: '150px' }}
                  />
                </div>
              </Link>
              
              {/* Location Selector - Desktop Only */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="hidden lg:flex items-center space-x-2" data-testid="button-location">
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

            {/* Search Bar - Desktop Only, Mobile in Side Menu */}
            <div className="hidden lg:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
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
            <div className="flex items-center space-x-2 lg:space-x-6">
              {/* Upload Prescription - Desktop Only */}
              <Link href="/prescription-upload" className="hidden lg:block">
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
                      <div className="text-left hidden lg:block">
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
                    <DropdownMenuItem onClick={handleLogout} disabled={logoutMutation.isPending}>
                      {logoutMutation.isPending ? "Logging out..." : "Logout"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  variant="ghost" 
                  onClick={() => setLocation('/login')}
                  className="flex items-center space-x-2"
                  data-testid="button-login"
                >
                  <UserIcon className="h-5 w-5" />
                  <div className="text-left hidden lg:block">
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
              <Link href="/cart">
                <Button variant="ghost" className="relative" data-testid="button-cart">
                  <ShoppingCart className="h-6 w-6 text-gray-600 hover:text-primary" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                  <div className="hidden lg:block ml-2">
                    <p className="text-sm font-medium text-gray-700">Cart</p>
                    <p className="text-xs text-gray-500">
                      {user ? `KES ${cartTotal.toFixed(2)}` : `${cartCount} items`}
                    </p>
                  </div>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu - Desktop Only */}
      <div className="bg-gray-50 border-b border-gray-200 hidden lg:block">
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

      {/* Mobile Side Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Side Menu */}
          <div className="fixed left-0 top-0 bottom-0 w-80 bg-white shadow-xl overflow-y-auto">
            <div className="p-4">
              {/* Close Button */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid="button-close-mobile-menu"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
              
              {/* Mobile Search */}
              <div className="mb-6">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search medicines..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-4 pr-12 py-2 border border-gray-200 rounded-lg focus:border-primary"
                    data-testid="input-search-mobile"
                  />
                  <Button 
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                    data-testid="button-search-mobile"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Location Selector */}
              <div className="mb-6">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full flex items-center justify-between" data-testid="button-location-mobile">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="text-sm">{selectedLocation}</span>
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full">
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

              {/* Navigation Links */}
              <nav className="space-y-2 mb-6">
                {navigationLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <Button 
                      variant="ghost" 
                      className={`w-full justify-start text-left ${
                        location === link.href 
                          ? "text-primary bg-primary/10" 
                          : "text-gray-700 hover:text-primary hover:bg-gray-50"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      data-testid={`nav-mobile-${link.label.toLowerCase().replace(" ", "-")}`}
                    >
                      {link.label}
                    </Button>
                  </Link>
                ))}
              </nav>

              {/* Upload Prescription */}
              <div className="border-t pt-4 mb-4">
                <Link href="/prescription-upload">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-left text-gray-700 hover:text-primary hover:bg-gray-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                    data-testid="nav-mobile-upload-prescription"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Prescription
                  </Button>
                </Link>
              </div>

              {/* Social Links */}
              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-3">Follow Us</p>
                <div className="flex space-x-3">
                  <Button variant="outline" size="icon" className="h-8 w-8" data-testid="social-facebook-mobile">
                    <Facebook className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" data-testid="social-twitter-mobile">
                    <Twitter className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" data-testid="social-instagram-mobile">
                    <Instagram className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" data-testid="social-linkedin-mobile">
                    <Linkedin className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}