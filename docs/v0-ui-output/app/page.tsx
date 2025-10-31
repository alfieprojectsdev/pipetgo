import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Clock, MapPin, CheckCircle2, ArrowRight, Star, Beaker, FlaskConical, TestTube2 } from "lucide-react"
import { PipetGoLogo } from "@/components/pipetgo-logo"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[url('/industrial-laboratory-equipment-testing-instrument.jpg')] opacity-10 bg-cover bg-center" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex justify-center mb-8">
              <PipetGoLogo showTagline className="scale-125" />
            </div>

            <Badge className="mb-6 bg-teal-500/20 text-teal-300 border-teal-500/30 hover:bg-teal-500/30">
              <Beaker className="h-3 w-3 mr-1" />
              Trusted by 50+ testing laboratories nationwide
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-balance">
              Materials Testing & Analytical Services, Simplified
            </h1>
            <p className="text-lg sm:text-xl text-white/90 mb-8 leading-relaxed">
              Connect with ISO 17025 certified laboratories across the Philippines. Submit test requests, track sample
              analysis, and receive certified reports—all in one platform.
            </p>

            {/* Search Bar */}
            <div className="bg-white rounded-lg p-2 shadow-xl max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search tests (e.g., Tensile Strength, XRF Analysis, Concrete Testing...)"
                    className="pl-10 border-0 focus-visible:ring-0 text-gray-900"
                  />
                </div>
                <Button size="lg" className="bg-teal-500 hover:bg-teal-600 text-white">
                  Find Testing Services
                </Button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-white/80">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> ISO 17025 Accredited
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> ASTM Compliant
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Certified Test Reports
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Popular Testing Services</h2>
            <p className="text-gray-600">Most requested analytical tests this month</p>
          </div>
          <Button variant="ghost" className="hidden sm:flex items-center gap-2">
            View All Services <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Tensile Strength Testing",
              lab: "Manila Materials Laboratory",
              category: "Mechanical Testing",
              price: "₱1,500",
              turnaround: "3 days",
              location: "Makati City",
              rating: 4.8,
              reviews: 124,
              icon: TestTube2,
            },
            {
              title: "XRF Analysis",
              lab: "Quezon Analytical Services",
              category: "Chemical Analysis",
              price: "₱3,500",
              turnaround: "5 days",
              location: "Quezon City",
              rating: 4.9,
              reviews: 89,
              icon: FlaskConical,
            },
            {
              title: "Concrete Compressive Test",
              lab: "Construction Testing Lab",
              category: "Civil Engineering",
              price: "₱800",
              turnaround: "2 days",
              location: "Makati City",
              rating: 4.7,
              reviews: 156,
              icon: Beaker,
            },
            {
              title: "Metallurgical Analysis",
              lab: "MetalTest Philippines",
              category: "Metallurgy",
              price: "₱2,800",
              turnaround: "7 days",
              location: "Pasig City",
              rating: 4.9,
              reviews: 203,
              icon: TestTube2,
            },
            {
              title: "Environmental Sampling",
              lab: "Environmental Lab Corp",
              category: "Environmental",
              price: "₱2,200",
              turnaround: "5 days",
              location: "Taguig City",
              rating: 4.8,
              reviews: 67,
              icon: FlaskConical,
            },
            {
              title: "Soil Composition Analysis",
              lab: "GeoTest Solutions",
              category: "Geotechnical",
              price: "₱1,200",
              turnaround: "4 days",
              location: "Caloocan City",
              rating: 4.6,
              reviews: 45,
              icon: Beaker,
            },
          ].map((service, idx) => (
            <Card key={idx} className="hover:shadow-lg transition-shadow cursor-pointer group border-gray-200">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="secondary" className="bg-teal-50 text-teal-700 border-teal-200">
                    {service.category}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-medium">{service.rating}</span>
                    <span className="text-gray-500">({service.reviews})</span>
                  </div>
                </div>
                <CardTitle className="text-xl group-hover:text-teal-600 transition-colors flex items-center gap-2">
                  <service.icon className="h-5 w-5 text-gray-400" />
                  {service.title}
                </CardTitle>
                <CardDescription className="text-gray-600">{service.lab}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{service.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{service.turnaround} turnaround</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-gray-900">{service.price}</span>
                  <span className="text-gray-500 text-sm ml-1">per sample</span>
                </div>
                <Button size="sm" className="bg-teal-500 hover:bg-teal-600">
                  Request Test
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Button variant="outline" className="w-full bg-transparent">
            View All Services
          </Button>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How PipetGo Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Get your materials testing and analysis done in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Browse & Select",
                description:
                  "Search our catalog of ISO 17025 certified laboratories and find the right test for your materials. Compare prices, turnaround times, and accreditations.",
              },
              {
                step: "02",
                title: "Submit Sample Request",
                description:
                  "Fill out a simple form describing your sample and testing requirements. Our labs will review and confirm your test request within 24 hours.",
              },
              {
                step: "03",
                title: "Receive Certified Reports",
                description:
                  "Track your sample status in real-time. Download your certified test reports securely once analysis is complete. All data is encrypted and confidential.",
              },
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="text-6xl font-bold text-teal-50 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
                {idx < 2 && <ArrowRight className="hidden md:block absolute -right-4 top-8 h-8 w-8 text-gray-300" />}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white">
              Get Started Now
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Trusted by Leading Organizations</h2>
          <p className="text-gray-600">
            Join hundreds of engineering firms and manufacturers who trust PipetGo for their testing needs
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
          {["ISO 17025", "ASTM Compliant", "PNRI Approved", "DTI Accredited"].map((cert, idx) => (
            <div key={idx} className="text-center">
              <div className="h-16 flex items-center justify-center">
                <Badge variant="outline" className="text-lg px-4 py-2 border-gray-300">
                  {cert}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-slate-900 to-teal-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-3 text-balance">Are you a testing laboratory?</h2>
              <p className="text-white/90 text-lg">
                Join PipetGo and connect with engineering firms and manufacturers nationwide. Manage test requests,
                upload certified reports, and grow your business.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" variant="secondary" className="bg-white text-slate-900 hover:bg-gray-100">
                Register Your Lab
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 bg-transparent">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
