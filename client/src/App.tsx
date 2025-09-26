import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import ProductDetail from "@/pages/ProductDetail";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import News from "@/pages/News";
import PrescriptionUpload from "@/pages/PrescriptionUpload";
import Consultation from "@/pages/Consultation";
import AdminProducts from "@/pages/AdminProducts";
import AdminImport from "@/pages/AdminImport";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminOrderManagement from "@/pages/AdminOrderManagement";
import AdminPrescriptionVerification from "@/pages/AdminPrescriptionVerification";
import AdminLogin from "@/pages/AdminLogin";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import TrackOrder from "@/pages/TrackOrder";
import Cart from "@/pages/Cart";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Payment from "@/pages/Payment";
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { user: adminUser, isAuthenticated: isAdminAuthenticated, isAdmin } = useAdminAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Only show navigation for non-admin routes */}
      {!window.location.pathname.startsWith('/admin') && <Navigation user={user} />}
      <main className="flex-1">
        <Switch>
          {/* Public routes */}
          <Route path="/" component={Home} />
          <Route path="/shop" component={Shop} />
          <Route path="/product/:id" component={ProductDetail} />
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
          <Route path="/news" component={News} />
          <Route path="/prescription-upload" component={PrescriptionUpload} />
          <Route path="/consultation" component={Consultation} />
          <Route path="/landing" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
          <Route path="/terms" component={Terms} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/track-order" component={TrackOrder} />
          <Route path="/cart" component={Cart} />

          {/* Admin login route - accessible without authentication */}
          <Route path="/admin/login" component={AdminLogin} />

          {/* Client authentication routes */}
          {isAuthenticated && (
            <>
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/payment/:orderId" component={Payment} />
            </>
          )}

          {/* Admin routes - require admin authentication */}
          {isAdminAuthenticated && isAdmin && (
            <>
              <Route path="/admin" component={AdminDashboard} />
              <Route path="/admin/dashboard" component={AdminDashboard} />
              <Route path="/admin/orders" component={AdminOrderManagement} />
              <Route path="/admin/prescriptions" component={AdminPrescriptionVerification} />
              <Route path="/admin/products" component={AdminProducts} />
              <Route path="/admin/products/add" component={AdminProducts} />
              <Route path="/admin/consultations" component={Consultation} />
              <Route path="/admin/import" component={AdminImport} />
            </>
          )}

          <Route component={NotFound} />
        </Switch>
      </main>
      {/* Only show footer for non-admin routes */}
      {!window.location.pathname.startsWith('/admin') && <Footer />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
