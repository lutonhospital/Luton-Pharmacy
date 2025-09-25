import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Hospital, ChevronDown } from "lucide-react";
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
  const [currentView, setCurrentView] = useState<'patient' | 'staff'>(
    user?.role === 'pharmacist' || user?.role === 'admin' ? 'staff' : 'patient'
  );

  const isStaff = user?.role === 'pharmacist' || user?.role === 'admin';
  const userInitials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` || 'U' : 'G';

  const navigationLinks = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <div className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer">
                <Hospital className="text-primary text-xl" />
                <h1 className="text-xl font-semibold text-foreground">Luton Hospital Pharmacy</h1>
              </div>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-6">
              {navigationLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Button 
                    variant="ghost" 
                    className={`text-sm font-medium transition-colors ${
                      location === link.href 
                        ? "text-primary bg-primary/10" 
                        : "text-muted-foreground hover:text-primary"
                    }`}
                    data-testid={`nav-${link.label.toLowerCase().replace(" ", "-")}`}
                  >
                    {link.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {isStaff && (
                  <div className="bg-secondary rounded-lg p-1 flex">
                    <Button
                      variant={currentView === 'patient' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setCurrentView('patient')}
                      className={currentView === 'patient' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}
                      data-testid="button-patient-view"
                    >
                      Patient View
                    </Button>
                    <Button
                      variant={currentView === 'staff' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setCurrentView('staff')}
                      className={currentView === 'staff' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}
                      data-testid="button-staff-view"
                    >
                      Staff Dashboard
                    </Button>
                  </div>
                )}
                
                <Button variant="ghost" size="icon" data-testid="button-notifications">
                  <Bell className="h-5 w-5" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2" data-testid="button-user-menu">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{user.firstName} {user.lastName}</span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => window.location.href = '/api/logout'}>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button 
                onClick={() => window.location.href = '/api/login'}
                data-testid="button-login"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
