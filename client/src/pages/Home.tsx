import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Truck,
  MessageCircle
} from "lucide-react";

// Import category icons
import trendingIcon from "@assets/stock_images/trending_pharmacy_ic_0c1d7c90.jpg";
import homecareIcon from "@assets/stock_images/home_healthcare_medi_62274b5b.jpg";
import beautyIcon from "@assets/stock_images/beauty_cosmetics_ico_257b0616.jpg";
import newArrivalsIcon from "@assets/stock_images/new_arrivals_pharmac_ea6f0152.jpg";

// Import pharmacy images for hero slider
import pharmacistImage1 from "@assets/stock_images/pharmacist_woman_wor_ef691acb.jpg";
import pharmacistImage2 from "@assets/stock_images/female_healthcare_wo_82323547.jpg";
import pharmacistImage3 from "@assets/stock_images/medical_professional_fef8052f.jpg";

// Hero slider data with female pharmacist images
const heroSlides = [
  {
    id: 1,
    title: "Your Trusted Online Pharmacy",
    subtitle: "Quality medicines delivered to your doorstep",
    description: "Browse our extensive catalog of prescription and over-the-counter medicines with expert pharmaceutical care",
    image: pharmacistImage1,
    cta: "Shop Now",
    ctaLink: "/shop"
  },
  {
    id: 2,
    title: "Professional Pharmacy Services",
    subtitle: "Expert medication dispensing",
    description: "Our qualified female pharmacists ensure safe and accurate medication dispensing for all your healthcare needs",
    image: pharmacistImage2,
    cta: "Upload Prescription",
    ctaLink: "/prescription-upload"
  },
  {
    id: 3,
    title: "Personalized Healthcare Solutions",
    subtitle: "Professional pharmaceutical guidance",
    description: "Receive expert consultation and medication counseling from our experienced pharmacy professionals",
    image: pharmacistImage3,
    cta: "Book Consultation",
    ctaLink: "/consultation"
  }
];

// Category navigation data
const categoryNavigation = [
  {
    id: 1,
    name: "Trending",
    image: trendingIcon,
    link: "/shop?category=trending"
  },
  {
    id: 2,
    name: "Home Healthcare",
    image: homecareIcon,
    link: "/shop?category=home-healthcare"
  },
  {
    id: 3,
    name: "Beauty Cosmetics",
    image: beautyIcon,
    link: "/shop?category=beauty-cosmetics"
  },
  {
    id: 4,
    name: "New Arrivals",
    image: newArrivalsIcon,
    link: "/shop?category=new-arrivals"
  }
];

// Promotional banners data
const promotionalBanners = [
  {
    id: 1,
    title: "Special Pharmacy Offers",
    description: "Get up to 50% off on selected medicines",
    link: "/shop"
  },
  {
    id: 2,
    title: "Health & Wellness",
    description: "Complete healthcare solutions at your doorstep",
    link: "/shop"
  },
  {
    id: 3,
    title: "Prescription Services",
    description: "Upload prescription and get medicines delivered",
    link: "/prescription-upload"
  }
];


// Trending products data
const trendingProducts = [
  {
    id: 1,
    name: "Paracetamol 500mg",
    price: 120,
    originalPrice: 150,
    discount: 20,
    image: "💊",
    rating: 4.8,
    inStock: true
  },
  {
    id: 2,
    name: "Vitamin D3 Tablets",
    price: 850,
    originalPrice: 1000,
    discount: 15,
    image: "💊",
    rating: 4.9,
    inStock: true
  },
  {
    id: 3,
    name: "Hand Sanitizer",
    price: 200,
    originalPrice: 250,
    discount: 20,
    image: "🧴",
    rating: 4.7,
    inStock: true
  },
  {
    id: 4,
    name: "Face Masks (50 pack)",
    price: 1500,
    originalPrice: 1800,
    discount: 17,
    image: "😷",
    rating: 4.6,
    inStock: true
  }
];

// Best sellers data
const bestSellers = [
  {
    id: 1,
    name: "Omeprazole 20mg",
    price: 350,
    originalPrice: 400,
    image: "💊",
    rating: 4.9,
    soldCount: 1250,
    inStock: true
  },
  {
    id: 2,
    name: "Multivitamin Complex",
    price: 1200,
    originalPrice: 1400,
    image: "💊",
    rating: 4.8,
    soldCount: 980,
    inStock: true
  },
  {
    id: 3,
    name: "Blood Pressure Monitor",
    price: 4500,
    originalPrice: 5000,
    image: "🩺",
    rating: 4.7,
    soldCount: 750,
    inStock: true
  },
  {
    id: 4,
    name: "Insulin Pens",
    price: 2800,
    originalPrice: 3200,
    image: "💉",
    rating: 4.9,
    soldCount: 650,
    inStock: true
  }
];

// Health conditions data
const healthConditions = [
  {
    id: 1,
    name: "Diabetes Care",
    description: "Blood glucose monitors, insulin, diabetic supplies",
    image: "🩺",
    link: "/shop?condition=diabetes",
    productCount: 45
  },
  {
    id: 2,
    name: "Heart Health",
    description: "Blood pressure monitors, heart medications",
    image: "❤️",
    link: "/shop?condition=heart",
    productCount: 38
  },
  {
    id: 3,
    name: "Pain Relief",
    description: "Analgesics, topical pain relievers, muscle relaxants",
    image: "🦴",
    link: "/shop?condition=pain",
    productCount: 62
  },
  {
    id: 4,
    name: "Respiratory Care",
    description: "Inhalers, cough syrups, allergy medications",
    image: "🫁",
    link: "/shop?condition=respiratory",
    productCount: 34
  },
  {
    id: 5,
    name: "Mental Health",
    description: "Antidepressants, anxiety medications, supplements",
    image: "🧠",
    link: "/shop?condition=mental-health",
    productCount: 28
  },
  {
    id: 6,
    name: "Digestive Health",
    description: "Probiotics, antacids, digestive enzymes",
    image: "🦴",
    link: "/shop?condition=digestive",
    productCount: 42
  }
];

// New arrivals data
const newArrivals = [
  {
    id: 1,
    name: "Smart Thermometer",
    price: 3500,
    image: "🌡️",
    rating: 4.8,
    isNew: true,
    inStock: true
  },
  {
    id: 2,
    name: "Collagen Supplements",
    price: 2200,
    image: "💊",
    rating: 4.7,
    isNew: true,
    inStock: true
  },
  {
    id: 3,
    name: "Pulse Oximeter",
    price: 2800,
    image: "📱",
    rating: 4.9,
    isNew: true,
    inStock: true
  },
  {
    id: 4,
    name: "Herbal Tea Collection",
    price: 800,
    image: "🍃",
    rating: 4.6,
    isNew: true,
    inStock: true
  }
];

// Shop by category data
const shopCategories = [
  {
    id: 1,
    name: "Skin Care",
    icon: "🧴",
    link: "/shop?category=skin-care"
  },
  {
    id: 2,
    name: "Beauty Care & Cosmetics",
    icon: "💄",
    link: "/shop?category=beauty-cosmetics"
  },
  {
    id: 3,
    name: "Vitamins & Supplements",
    icon: "💊",
    link: "/shop?category=vitamins-supplements"
  },
  {
    id: 4,
    name: "Medicine",
    icon: "💉",
    link: "/shop?category=medicine"
  },
  {
    id: 5,
    name: "Body Building",
    icon: "💪",
    link: "/shop?category=body-building"
  },
  {
    id: 6,
    name: "General Hygiene Care",
    icon: "🧼",
    link: "/shop?category=hygiene-care"
  },
  {
    id: 7,
    name: "Home Healthcare",
    icon: "🏥",
    link: "/shop?category=home-healthcare"
  },
  {
    id: 8,
    name: "Bundle Offers",
    icon: "📦",
    link: "/shop?category=bundle-offers"
  }
];

// Product interface for API data
interface Product {
  id: string;
  medicationName: string;
  dosage: string;
  description: string;
  category: string;
  imageUrl: string;
  unitPrice: string;
  originalPrice?: string;
  currentStock: number;
  requiresPrescription: boolean;
  rating?: number;
}

// Helper function to create safe data-testids
const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export default function Home() {
  const [, setLocation] = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentBanner, setCurrentBanner] = useState(0);

  // Fetch 12 random products for Featured Medicines section
  const { data: featuredMedicines, isLoading: medicinesLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", { limit: 12, random: true }],
    queryFn: async () => {
      const response = await fetch("/api/products?limit=12&random=true");
      if (!response.ok) throw new Error("Failed to fetch featured medicines");
      return response.json();
    },
    enabled: true,
  });

  // Auto-slide functionality for hero slider
  useEffect(() => {
    const heroTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(heroTimer);
  }, []);

  // Auto-slide functionality for promotional banners
  useEffect(() => {
    const bannerTimer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % promotionalBanners.length);
    }, 4000);

    return () => clearInterval(bannerTimer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
              <div className="h-full relative flex items-center">
                <img 
                  src={slide.image} 
                  alt={slide.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70"></div>
                <div className="container mx-auto px-4 relative z-10">
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
                        <Button size="lg" variant="secondary" className="text-lg px-8 py-6" data-testid={`button-${slugify(slide.cta)}`}>
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
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? "bg-white" : "bg-white/50"
              }`}
              data-testid={`button-slide-indicator-${index}`}
            />
          ))}
        </div>
      </section>


      {/* Category Navigation */}
      <section className="bg-white py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categoryNavigation.map((category) => (
              <Link key={category.id} href={category.link}>
                <div className="text-center cursor-pointer hover:transform hover:scale-105 transition-transform" data-testid={`link-category-${slugify(category.name)}`}>
                  <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden bg-gray-100">
                    <img 
                      src={category.image} 
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-sm font-medium text-gray-700">{category.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Promotional Banners Carousel */}
      <section className="bg-white py-6">
        <div className="container mx-auto px-4">
          <div className="relative h-48 overflow-hidden rounded-lg">
            {promotionalBanners.map((banner, index) => (
              <div
                key={banner.id}
                className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
                  index === currentBanner ? "translate-x-0" : 
                  index < currentBanner ? "-translate-x-full" : "translate-x-full"
                }`}
              >
                <div className="h-full bg-gradient-to-r from-primary to-primary/80 flex items-center">
                  <div className="container mx-auto px-4">
                    <div className="text-white">
                      <h3 className="text-2xl font-bold mb-2">{banner.title}</h3>
                      <p className="text-lg mb-4">{banner.description}</p>
                      <Link href={banner.link}>
                        <Button variant="secondary" data-testid={`button-banner-${banner.id}`}>
                          Shop Now
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Banner indicators */}
          <div className="flex justify-center mt-4 space-x-2">
            {promotionalBanners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentBanner(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentBanner ? "bg-primary" : "bg-gray-300"
                }`}
                data-testid={`button-banner-indicator-${index}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Medicines */}
      <section className="bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Featured Medicines</h2>
            <Link href="/shop">
              <Button variant="outline" data-testid="button-view-all-featured">
                View All
              </Button>
            </Link>
          </div>
          {medicinesLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-200 h-32 rounded-lg mb-3"></div>
                  <div className="bg-gray-200 h-4 rounded mb-2"></div>
                  <div className="bg-gray-200 h-4 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : featuredMedicines && featuredMedicines.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {featuredMedicines.map((product) => (
                <Card key={product.id} className="cursor-pointer hover:shadow-lg transition-shadow" data-testid={`card-featured-${slugify(product.medicationName)}`}>
                  <CardContent className="p-4">
                    <div className="text-center mb-3">
                      <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">💊</span>
                      </div>
                      <h3 className="text-sm font-medium text-gray-800 mb-2 line-clamp-2">{product.medicationName}</h3>
                      <p className="text-xs text-gray-500 mb-2">{product.dosage}</p>
                      <div className="flex items-center justify-center mb-2">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`h-3 w-3 ${star <= (product.rating || 4) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 ml-1">({product.rating || 4})</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2 mb-3">
                        <span className="text-lg font-bold text-primary">KES {product.unitPrice}</span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-500 line-through">KES {product.originalPrice}</span>
                        )}
                      </div>
                      {product.requiresPrescription && (
                        <Badge variant="outline" className="text-xs mb-2">
                          Prescription Required
                        </Badge>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full bg-primary hover:bg-primary/90 text-xs"
                      data-testid={`button-add-to-cart-${product.id}`}
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Add to Cart
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No featured medicines available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Shop by Category */}
      <section className="bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {shopCategories.map((category) => (
              <Link key={category.id} href={category.link}>
                <Card className="cursor-pointer hover:shadow-lg transition-shadow" data-testid={`card-category-${slugify(category.name)}`}>
                  <CardContent className="p-4 text-center">
                    <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-3xl">{category.icon}</span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-700 leading-tight">{category.name}</h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Special Offers */}
      <section className="bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Diabetes Care Offer */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-yellow-400 text-red-600 px-3 py-1 text-xs font-bold rounded-bl-lg">
                Special Offer
              </div>
              <h3 className="text-2xl font-bold mb-2">Diabetes Care</h3>
              <p className="text-lg mb-4">Get up to 30% Off</p>
              <Link href="/shop?category=diabetes">
                <Button variant="secondary" className="bg-white text-red-600 hover:bg-gray-100" data-testid="button-diabetes-offer">
                  Shop Now
                </Button>
              </Link>
              <div className="absolute -right-4 -bottom-4 opacity-20">
                <Shield className="w-24 h-24" />
              </div>
            </div>

            {/* Health Devices Offer */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-green-400 text-blue-600 px-3 py-1 text-xs font-bold rounded-bl-lg">
                Limited Time
              </div>
              <h3 className="text-2xl font-bold mb-2">Health Devices</h3>
              <p className="text-lg mb-4">Get up to 25% Off</p>
              <Link href="/shop?category=health-devices">
                <Button variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100" data-testid="button-health-devices-offer">
                  Shop Now
                </Button>
              </Link>
              <div className="absolute -right-4 -bottom-4 opacity-20">
                <Clock className="w-24 h-24" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Products */}
      <section className="bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Trending Products</h2>
            <Link href="/shop?section=trending">
              <Button variant="outline" data-testid="button-view-all-trending">
                View All
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {trendingProducts.map((product) => (
              <Card key={product.id} className="cursor-pointer hover:shadow-lg transition-shadow" data-testid={`card-trending-${slugify(product.name)}`}>
                <CardContent className="p-4">
                  <div className="text-center mb-3">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">{product.image}</span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-800 mb-2">{product.name}</h3>
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <span className="text-lg font-bold text-primary">KES {product.price}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-500 line-through">KES {product.originalPrice}</span>
                      )}
                    </div>
                    {product.discount && (
                      <Badge variant="secondary" className="text-xs">
                        {product.discount}% OFF
                      </Badge>
                    )}
                    <div className="flex items-center justify-center mt-2">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-gray-600 ml-1">{product.rating}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Best Sellers</h2>
            <Link href="/shop?section=best-sellers">
              <Button variant="outline" data-testid="button-view-all-bestsellers">
                View All
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {bestSellers.map((product) => (
              <Card key={product.id} className="cursor-pointer hover:shadow-lg transition-shadow" data-testid={`card-bestseller-${slugify(product.name)}`}>
                <CardContent className="p-4">
                  <div className="text-center mb-3">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">{product.image}</span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-800 mb-2">{product.name}</h3>
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <span className="text-lg font-bold text-primary">KES {product.price}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-500 line-through">KES {product.originalPrice}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-center space-x-4 text-xs text-gray-600">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="ml-1">{product.rating}</span>
                      </div>
                      <span>{product.soldCount} sold</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Shop By Your Health Condition */}
      <section className="bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Shop By Your Health Condition</h2>
            <p className="text-gray-600">Find targeted solutions for your specific health needs</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {healthConditions.map((condition) => (
              <Link key={condition.id} href={condition.link}>
                <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full" data-testid={`card-condition-${slugify(condition.name)}`}>
                  <CardContent className="p-6 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-3xl">{condition.image}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{condition.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{condition.description}</p>
                    <Badge variant="outline" className="text-xs">
                      {condition.productCount} products
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">New Arrivals</h2>
            <Link href="/shop?section=new-arrivals">
              <Button variant="outline" data-testid="button-view-all-newarrivals">
                View All
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {newArrivals.map((product) => (
              <Card key={product.id} className="cursor-pointer hover:shadow-lg transition-shadow relative" data-testid={`card-newarrival-${slugify(product.name)}`}>
                <CardContent className="p-4">
                  {product.isNew && (
                    <Badge className="absolute top-2 right-2 bg-red-500 text-white text-xs">
                      NEW
                    </Badge>
                  )}
                  <div className="text-center mb-3">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">{product.image}</span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-800 mb-2">{product.name}</h3>
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <span className="text-lg font-bold text-primary">KES {product.price}</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-gray-600 ml-1">{product.rating}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Health Insights & Updates */}
      <section className="bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Health Insights & Updates</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Stay informed with the latest research, health tips, and pharmaceutical advancements from our expert team
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Article 1 */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow" data-testid="article-malaria-prevention">
              <div className="h-48 bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                <span className="text-6xl">🦟</span>
              </div>
              <div className="p-6">
                <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-3">
                  Disease Prevention
                </span>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Malaria Prevention in Kenya: Essential Tips for the Rainy Season</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  Learn about the latest malaria prevention strategies, including proper use of bed nets, effective mosquito repellents, and when to seek treatment in Kenya.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Dec 20, 2024</span>
                  <Link href="/news/malaria-prevention-kenya">
                    <Button variant="outline" size="sm" data-testid="button-read-more-malaria">
                      Read More
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Article 2 */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow" data-testid="article-diabetes-management">
              <div className="h-48 bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center">
                <span className="text-6xl">📊</span>
              </div>
              <div className="p-6">
                <span className="inline-block bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                  Chronic Care
                </span>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Managing Diabetes: Blood Sugar Monitoring Best Practices</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  Discover the latest guidelines for diabetes management, including proper blood glucose monitoring, medication timing, and dietary considerations for Kenyan patients.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Dec 18, 2024</span>
                  <Link href="/news/diabetes-management-guidelines">
                    <Button variant="outline" size="sm" data-testid="button-read-more-diabetes">
                      Read More
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Article 3 */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow" data-testid="article-hypertension-awareness">
              <div className="h-48 bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center">
                <span className="text-6xl">❤️</span>
              </div>
              <div className="p-6">
                <span className="inline-block bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                  Heart Health
                </span>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Understanding Hypertension: The Silent Killer in Kenya</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  Learn about hypertension symptoms, risk factors, and the importance of regular blood pressure monitoring for Kenyan adults over 40.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Dec 15, 2024</span>
                  <Link href="/news/hypertension-awareness-kenya">
                    <Button variant="outline" size="sm" data-testid="button-read-more-hypertension">
                      Read More
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link href="/news">
              <Button className="bg-primary hover:bg-primary/90 text-white px-8 py-3" data-testid="button-view-all-health-insights">
                View All Health Articles
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Chat Support Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          className="rounded-full w-14 h-14 bg-primary hover:bg-primary/90 shadow-lg"
          data-testid="button-chat-support"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </Button>
      </div>
    </div>
  );
}