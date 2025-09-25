import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Calendar, User, ArrowRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";

// Sample news articles data - in a real app, this would come from an API
const newsArticles = [
  {
    id: 1,
    title: "Malaria Prevention in Kenya: Essential Tips for the Rainy Season",
    excerpt: "Learn about the latest malaria prevention strategies, including proper use of bed nets, effective mosquito repellents, and when to seek treatment in Kenya.",
    content: "As Kenya enters the rainy season, malaria cases typically increase across the country. This comprehensive guide covers essential prevention strategies including proper use of ITNs (Insecticide-Treated Nets), effective mosquito repellents, environmental management, and early detection symptoms. Our expert pharmacists recommend maintaining a well-stocked first aid kit with recommended antimalarial medications.",
    category: "Disease Prevention",
    author: "Dr. Sarah Kimani",
    publishDate: "December 20, 2024",
    readTime: "5 min read",
    image: "🦟",
    featured: true
  },
  {
    id: 2,
    title: "Managing Diabetes: Blood Sugar Monitoring Best Practices",
    excerpt: "Discover the latest guidelines for diabetes management, including proper blood glucose monitoring, medication timing, and dietary considerations for Kenyan patients.",
    content: "Diabetes management has evolved significantly with new technologies and treatment approaches. This article covers the latest blood glucose monitoring devices available in Kenya, proper testing techniques, medication schedules, and culturally appropriate dietary modifications for optimal diabetes control.",
    category: "Chronic Care",
    author: "Dr. James Mwangi", 
    publishDate: "December 18, 2024",
    readTime: "7 min read",
    image: "📊",
    featured: true
  },
  {
    id: 3,
    title: "Understanding Hypertension: The Silent Killer in Kenya",
    excerpt: "Learn about hypertension symptoms, risk factors, and the importance of regular blood pressure monitoring for Kenyan adults over 40.",
    content: "Hypertension affects over 3 million Kenyans, yet many remain undiagnosed. This article explores risk factors specific to the Kenyan population, lifestyle modifications, medication options available locally, and the importance of regular monitoring for early detection and management.",
    category: "Heart Health",
    author: "Dr. Grace Wanjiku",
    publishDate: "December 15, 2024", 
    readTime: "6 min read",
    image: "❤️",
    featured: false
  },
  {
    id: 4,
    title: "COVID-19 Vaccination Updates: Booster Guidelines for Kenya",
    excerpt: "Latest information on COVID-19 booster shots, eligibility criteria, and vaccination schedules recommended by the Ministry of Health.",
    content: "Stay updated with the latest COVID-19 vaccination guidelines from Kenya's Ministry of Health. This comprehensive guide covers booster shot recommendations, eligibility criteria for different age groups, and where to access vaccines across the country.",
    category: "Public Health",
    author: "Dr. Peter Kamau",
    publishDate: "December 12, 2024",
    readTime: "4 min read", 
    image: "💉",
    featured: false
  },
  {
    id: 5,
    title: "Mental Health Awareness: Breaking the Stigma in Kenyan Communities",
    excerpt: "Addressing mental health challenges and promoting awareness about available treatment options and support systems in Kenya.",
    content: "Mental health awareness is growing in Kenya, but stigma remains a significant barrier to treatment. This article discusses common mental health conditions, available treatment options, how to access mental health services, and ways communities can support mental wellness.",
    category: "Mental Health",
    author: "Dr. Mary Njoroge", 
    publishDate: "December 10, 2024",
    readTime: "8 min read",
    image: "🧠",
    featured: false
  },
  {
    id: 6,
    title: "Maternal Health: Prenatal Care Essentials for Kenyan Mothers",
    excerpt: "Comprehensive guide to prenatal care, nutrition, and medication safety during pregnancy for expectant mothers in Kenya.",
    content: "Proper prenatal care is crucial for healthy pregnancies and deliveries. This guide covers essential prenatal vitamins, safe medications during pregnancy, nutrition recommendations, and the importance of regular antenatal visits for Kenyan mothers.",
    category: "Maternal Health",
    author: "Dr. Ruth Mutua",
    publishDate: "December 8, 2024",
    readTime: "9 min read",
    image: "🤱",
    featured: false
  }
];

const categories = [
  "All Categories",
  "Disease Prevention", 
  "Chronic Care",
  "Heart Health", 
  "Public Health",
  "Mental Health",
  "Maternal Health"
];

export default function News() {
  const { user, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  // Filter articles based on search and category
  const filteredArticles = newsArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All Categories" || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredArticles = filteredArticles.filter(article => article.featured);
  const regularArticles = filteredArticles.filter(article => !article.featured);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Health News & Insights
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Stay informed with the latest health research, pharmaceutical updates, and wellness tips from Kenya's leading healthcare experts
            </p>
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search health articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary"
                  data-testid="input-search-articles"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="text-sm"
                data-testid={`button-category-${category.toLowerCase().replace(/ /g, '-')}`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Featured Articles */}
        {featuredArticles.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Featured Articles</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredArticles.map((article) => (
                <Card key={article.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`featured-article-${article.id}`}>
                  <div className="h-64 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <span className="text-8xl">{article.image}</span>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="secondary" className="text-xs">
                        {article.category}
                      </Badge>
                      <span className="text-xs text-gray-500">{article.readTime}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <User className="h-3 w-3" />
                        <span>{article.author}</span>
                        <Calendar className="h-3 w-3 ml-2" />
                        <span>{article.publishDate}</span>
                      </div>
                      <Link href={`/news/${article.id}`}>
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" data-testid={`button-read-article-${article.id}`}>
                          Read More <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Regular Articles */}
        {regularArticles.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Latest Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularArticles.map((article) => (
                <Card key={article.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`article-${article.id}`}>
                  <div className="h-48 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                    <span className="text-6xl">{article.image}</span>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {article.category}
                      </Badge>
                      <span className="text-xs text-gray-500">{article.readTime}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>{article.author}</span>
                      <span>{article.publishDate}</span>
                    </div>
                    <Link href={`/news/${article.id}`}>
                      <Button variant="outline" size="sm" className="w-full" data-testid={`button-read-article-${article.id}`}>
                        Read Full Article
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📰</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No articles found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or category filter
            </p>
            <Button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All Categories");
              }}
              variant="outline"
              data-testid="button-clear-filters"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Newsletter Signup */}
      <div className="bg-primary/5 py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Stay Updated</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Subscribe to our newsletter to receive the latest health insights, pharmaceutical updates, and wellness tips directly in your inbox
          </p>
          <div className="max-w-md mx-auto flex space-x-2">
            <Input
              type="email"
              placeholder="Enter your email"
              className="flex-1"
              data-testid="input-newsletter-signup"
            />
            <Button className="bg-primary hover:bg-primary/90" data-testid="button-newsletter-signup">
              Subscribe
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}