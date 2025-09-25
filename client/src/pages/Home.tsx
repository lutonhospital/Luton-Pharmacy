import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { 
  ShoppingCart, 
  Upload, 
  Video, 
  Star, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  Clock,
  Truck
} from "lucide-react";

const heroSlides = [
  {
    id: 1,
    title: "Your Trusted Online Pharmacy",
    subtitle: "Quality medicines delivered to your doorstep",
    description: "Browse our extensive catalog of prescription and over-the-counter medicines",
    image: "/api/placeholder/800/400",
    cta: "Shop Now",
    ctaLink: "/shop"
  },
  {
    id: 2,
    title: "Upload Your Prescription",
    subtitle: "Easy prescription management",
    description: "Upload your prescription and get your medicines delivered safely",
    image: "/api/placeholder/800/400",
    cta: "Upload Prescription",
    ctaLink: "/prescription-upload"
  },
  {
    id: 3,
    title: "Consult with Our Pharmacists",
    subtitle: "Professional healthcare advice",
    description: "Book online consultations with certified pharmacists",
    image: "/api/placeholder/800/400",
    cta: "Book Consultation",
    ctaLink: "/consultation"
  }
];

const featuredProducts = [
  {
    id: "1",
    name: "Paracetamol 500mg",
    category: "Over the Counter",
    price: 120,
    originalPrice: 150,
    image: "/api/placeholder/200/200",
    rating: 4.8,
    inStock: true
  },
  {
    id: "2", 
    name: "Vitamin D3 Tablets",
    category: "Vitamins & Supplements",
    price: 850,
    originalPrice: 1000,
    image: "/api/placeholder/200/200",
    rating: 4.9,
    inStock: true
  },
  {
    id: "3",
    name: "Digital Thermometer",
    category: "Medical Devices", 
    price: 1200,
    originalPrice: 1500,
    image: "/api/placeholder/200/200",
    rating: 4.7,
    inStock: true
  }
];

export default function Home() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-slide functionality
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Slider Section */}
      <section className="relative h-[600px] overflow-hidden">
        <div className="relative w-full h-full">
          {heroSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
                index === currentSlide ? "translate-x-0" : 
                index < currentSlide ? "-translate-x-full" : "translate-x-full"
              }`}
            >
              <div className="h-full bg-gradient-to-r from-primary/90 to-primary/70 flex items-center">
                <div className="container mx-auto px-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <div className="text-white space-y-6">
                      <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                        {slide.title}
                      </h1>
                      <h2 className="text-xl lg:text-2xl font-medium opacity-90">
                        {slide.subtitle}
                      </h2>
                      <p className="text-lg opacity-80 max-w-md">
                        {slide.description}
                      </p>
                      <Link href={slide.ctaLink}>
                        <Button size="lg" variant="secondary" className="text-lg px-8 py-6" data-testid={`button-${slide.cta.toLowerCase().replace(" ", "-")}`}>
                          {slide.cta}
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </Link>
                    </div>
                    <div className="hidden lg:block">
                      <div className="w-full h-96 bg-white/10 rounded-lg backdrop-blur-sm flex items-center justify-center">
                        <div className="text-white/60 text-6xl">🏥</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Slider Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
          data-testid="button-prev-slide"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
          data-testid="button-next-slide"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? "bg-white" : "bg-white/50"
              }`}
              data-testid={`indicator-slide-${index}`}
            />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold">Authentic Medicines</h3>
              <p className="text-muted-foreground">
                All our medicines are sourced from licensed manufacturers and verified for authenticity
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary rounded-full flex items-center justify-center">
                <Truck className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold">Fast Delivery</h3>
              <p className="text-muted-foreground">
                Same day delivery in Nairobi and next day delivery countrywide
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary rounded-full flex items-center justify-center">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold">24/7 Support</h3>
              <p className="text-muted-foreground">
                Our pharmacists are available round the clock for consultations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Products</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover our most popular medicines and health products, carefully selected for quality and effectiveness
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    <div className="text-4xl">💊</div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <Badge variant="secondary" className="mb-2">
                        {product.category}
                      </Badge>
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(product.rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                      <span className="text-sm text-muted-foreground ml-2">
                        {product.rating}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-primary">
                            KES {product.price.toLocaleString()}
                          </span>
                          {product.originalPrice && (
                            <span className="text-sm text-muted-foreground line-through">
                              KES {product.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <Badge 
                          variant={product.inStock ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {product.inStock ? "In Stock" : "Out of Stock"}
                        </Badge>
                      </div>
                      <Button size="sm" disabled={!product.inStock} data-testid={`button-add-to-cart-${product.id}`}>
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/shop">
              <Button size="lg" data-testid="button-view-all-products">
                View All Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Quick Actions</h2>
            <p className="text-muted-foreground">
              Get the care you need with our convenient services
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 mx-auto bg-secondary rounded-full flex items-center justify-center mb-6">
                <Upload className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Upload Prescription</h3>
              <p className="text-muted-foreground mb-6">
                Upload your prescription and we'll prepare your medicines for delivery
              </p>
              <Link href="/prescription-upload">
                <Button size="lg" variant="outline" data-testid="button-upload-prescription">
                  Upload Now
                </Button>
              </Link>
            </Card>
            
            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 mx-auto bg-secondary rounded-full flex items-center justify-center mb-6">
                <Video className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Book Consultation</h3>
              <p className="text-muted-foreground mb-6">
                Consult with our certified pharmacists for professional advice
              </p>
              <Link href="/consultation">
                <Button size="lg" variant="outline" data-testid="button-book-consultation">
                  Book Now
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}