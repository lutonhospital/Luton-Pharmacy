import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Shield, 
  Clock, 
  Users, 
  Award,
  Target,
  Eye,
  Stethoscope
} from "lucide-react";

const teamMembers = [
  {
    name: "Dr. Sarah Mwangi",
    role: "Chief Pharmacist",
    experience: "15+ years",
    specialization: "Clinical Pharmacy",
    image: "/api/placeholder/150/150"
  },
  {
    name: "Dr. John Kiprotich",
    role: "Senior Pharmacist",
    experience: "12+ years", 
    specialization: "Pharmaceutical Care",
    image: "/api/placeholder/150/150"
  },
  {
    name: "Dr. Grace Wanjiku",
    role: "Consultant Pharmacist",
    experience: "10+ years",
    specialization: "Medication Therapy Management",
    image: "/api/placeholder/150/150"
  }
];

const achievements = [
  {
    icon: Users,
    title: "50,000+",
    description: "Patients Served",
    color: "text-primary"
  },
  {
    icon: Award,
    title: "15+",
    description: "Years of Excellence",
    color: "text-secondary"
  },
  {
    icon: Shield,
    title: "100%",
    description: "Authentic Medicines",
    color: "text-primary"
  },
  {
    icon: Clock,
    title: "24/7",
    description: "Customer Support",
    color: "text-secondary"
  }
];

export default function About() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">About Luton Hospital Pharmacy</h1>
          <p className="text-muted-foreground max-w-3xl mx-auto text-lg">
            Your trusted healthcare partner, committed to providing quality pharmaceutical 
            services and exceptional patient care in the heart of Nairobi.
          </p>
        </div>

        {/* Our Story */}
        <section className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Established in 2008, Luton Hospital Pharmacy has been serving the Nairobi 
                  community with dedication and excellence for over 15 years. Located in the 
                  bustling China Centre Mall on Ngong Road, we have grown from a small community 
                  pharmacy to one of Kenya's most trusted healthcare providers.
                </p>
                <p>
                  Our journey began with a simple mission: to make quality healthcare accessible 
                  to everyone. Today, we continue to uphold this vision by combining traditional 
                  pharmaceutical care with modern technology to serve our patients better.
                </p>
                <p>
                  We pride ourselves on being more than just a pharmacy. We are healthcare 
                  partners, consultants, and advocates for our community's wellbeing.
                </p>
              </div>
            </div>
            <div className="flex justify-center">
              <Card className="p-8 bg-primary/5 border-primary/20">
                <CardContent className="text-center">
                  <div className="w-24 h-24 mx-auto bg-primary rounded-full flex items-center justify-center mb-6">
                    <Heart className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Caring for Community</h3>
                  <p className="text-muted-foreground">
                    Every patient is family to us. We believe in providing personalized 
                    care that goes beyond just dispensing medications.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Mission, Vision, Values */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-8">
              <CardContent>
                <div className="w-16 h-16 mx-auto bg-primary rounded-full flex items-center justify-center mb-6">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Our Mission</h3>
                <p className="text-muted-foreground">
                  To provide accessible, reliable, and professional pharmaceutical services 
                  that improve the health and well-being of our community through quality 
                  medications and expert care.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8">
              <CardContent>
                <div className="w-16 h-16 mx-auto bg-secondary rounded-full flex items-center justify-center mb-6">
                  <Eye className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Our Vision</h3>
                <p className="text-muted-foreground">
                  To be Kenya's leading pharmacy, recognized for excellence in patient care, 
                  innovation in healthcare delivery, and commitment to improving lives 
                  through accessible healthcare solutions.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8">
              <CardContent>
                <div className="w-16 h-16 mx-auto bg-primary rounded-full flex items-center justify-center mb-6">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Our Values</h3>
                <ul className="text-muted-foreground text-left space-y-2">
                  <li>• Integrity in all our dealings</li>
                  <li>• Compassionate patient care</li>
                  <li>• Professional excellence</li>
                  <li>• Community commitment</li>
                  <li>• Continuous innovation</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Achievements */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Achievements</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Numbers that reflect our commitment to excellence and the trust our 
              community has placed in us over the years.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {achievements.map((achievement, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
                <CardContent className="space-y-4">
                  <div className={`w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center`}>
                    <achievement.icon className={`h-6 w-6 ${achievement.color}`} />
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${achievement.color}`}>
                      {achievement.title}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {achievement.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Our Team */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Meet Our Expert Team</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our team of qualified pharmacists and healthcare professionals are 
              dedicated to providing you with the best possible care and advice.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
                <CardContent className="space-y-4">
                  <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center">
                    <Stethoscope className="h-12 w-12 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{member.name}</h3>
                    <p className="text-primary font-medium">{member.role}</p>
                    <div className="space-y-2 mt-3">
                      <Badge variant="secondary">{member.experience}</Badge>
                      <p className="text-sm text-muted-foreground">
                        {member.specialization}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Services */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Services</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive pharmaceutical services designed to meet all your healthcare needs.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <CardContent className="space-y-3">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold">Prescription Dispensing</h3>
                <p className="text-sm text-muted-foreground">
                  Accurate and timely dispensing of prescription medications with 
                  professional counseling and guidance.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="space-y-3">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold">Health Consultations</h3>
                <p className="text-sm text-muted-foreground">
                  One-on-one consultations with qualified pharmacists for medication 
                  reviews and health advice.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="space-y-3">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold">24/7 Emergency Services</h3>
                <p className="text-sm text-muted-foreground">
                  Round-the-clock availability for urgent medication needs and 
                  emergency pharmaceutical services.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="space-y-3">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold">Home Delivery</h3>
                <p className="text-sm text-muted-foreground">
                  Convenient home delivery services for prescription and over-the-counter 
                  medications across Nairobi.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="space-y-3">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold">Health Screenings</h3>
                <p className="text-sm text-muted-foreground">
                  Basic health screenings including blood pressure, blood sugar, 
                  and BMI measurements.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="space-y-3">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                  <Stethoscope className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold">Medical Equipment</h3>
                <p className="text-sm text-muted-foreground">
                  Quality medical devices and equipment for home use, including 
                  monitoring devices and mobility aids.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Commitment */}
        <section>
          <Card className="p-8 bg-primary/5 border-primary/20">
            <CardContent className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold">Our Commitment to You</h2>
              <p className="text-muted-foreground max-w-3xl mx-auto">
                At Luton Hospital Pharmacy, we are committed to being your trusted healthcare partner. 
                We ensure that every medication dispensed meets the highest quality standards, 
                every consultation provides valuable guidance, and every interaction reflects our 
                dedication to your health and well-being.
              </p>
              <div className="pt-4">
                <Badge variant="outline" className="text-primary border-primary px-6 py-2">
                  Licensed & Regulated by Pharmacy and Poisons Board of Kenya
                </Badge>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}