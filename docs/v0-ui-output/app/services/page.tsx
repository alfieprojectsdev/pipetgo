"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Search, SlidersHorizontal, MapPin, Clock, Star, X, Beaker } from "lucide-react"

export default function ServicesPage() {
  const [showFilters, setShowFilters] = useState(false)
  const [priceRange, setPriceRange] = useState([0, 5000])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input placeholder="Search testing services or laboratories..." className="pl-10" />
            </div>
            <Button variant="outline" className="sm:hidden bg-transparent" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Active Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="secondary" className="gap-2 bg-teal-50 text-teal-700 border-teal-200">
              Mechanical Testing
              <X className="h-3 w-3 cursor-pointer" />
            </Badge>
            <Badge variant="secondary" className="gap-2 bg-teal-50 text-teal-700 border-teal-200">
              Quezon City
              <X className="h-3 w-3 cursor-pointer" />
            </Badge>
            <Button variant="ghost" size="sm" className="h-6 text-xs">
              Clear all
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <aside
            className={`
            ${showFilters ? "block" : "hidden"} sm:block
            w-full sm:w-64 flex-shrink-0
            fixed sm:sticky top-20 left-0 right-0 sm:top-24
            bg-white sm:bg-transparent
            z-20 sm:z-0
            p-4 sm:p-0
            shadow-lg sm:shadow-none
            max-h-[calc(100vh-5rem)] overflow-y-auto
          `}
          >
            <div className="space-y-6">
              {/* Category Filter */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Test Category</h3>
                <div className="space-y-3">
                  {[
                    "Mechanical Testing",
                    "Chemical Analysis",
                    "Metallurgy",
                    "Civil Engineering",
                    "Environmental",
                    "Geotechnical",
                  ].map((category) => (
                    <div key={category} className="flex items-center gap-2">
                      <Checkbox id={category} />
                      <Label htmlFor={category} className="text-sm cursor-pointer">
                        {category}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Price Range</h3>
                <Slider value={priceRange} onValueChange={setPriceRange} max={5000} step={100} className="mb-4" />
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>₱{priceRange[0]}</span>
                  <span>₱{priceRange[1]}</span>
                </div>
              </div>

              {/* Location Filter */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Location</h3>
                <div className="space-y-3">
                  {["Makati City", "Quezon City", "Taguig City", "Pasig City", "Manila"].map((location) => (
                    <div key={location} className="flex items-center gap-2">
                      <Checkbox id={location} />
                      <Label htmlFor={location} className="text-sm cursor-pointer">
                        {location}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Turnaround Time */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Turnaround Time</h3>
                <div className="space-y-3">
                  {["1-2 days", "3-5 days", "6-7 days", "1-2 weeks"].map((time) => (
                    <div key={time} className="flex items-center gap-2">
                      <Checkbox id={time} />
                      <Label htmlFor={time} className="text-sm cursor-pointer">
                        {time}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Accreditations</h3>
                <div className="space-y-3">
                  {["ISO 17025", "ASTM Compliant", "PNRI Approved", "DTI Accredited"].map((cert) => (
                    <div key={cert} className="flex items-center gap-2">
                      <Checkbox id={cert} />
                      <Label htmlFor={cert} className="text-sm cursor-pointer">
                        {cert}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Results */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                Showing <span className="font-semibold text-gray-900">47 testing services</span>
              </p>
              <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option>Sort by: Relevance</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Turnaround: Fastest</option>
                <option>Rating: Highest</option>
              </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 8 }).map((_, idx) => (
                <Card key={idx} className="hover:shadow-lg transition-shadow cursor-pointer group border-gray-200">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary" className="bg-teal-50 text-teal-700 border-teal-200">
                        Mechanical Testing
                      </Badge>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium">4.8</span>
                      </div>
                    </div>
                    <CardTitle className="text-lg group-hover:text-teal-600 transition-colors flex items-center gap-2">
                      <Beaker className="h-4 w-4 text-gray-400" />
                      Tensile Strength Testing
                    </CardTitle>
                    <CardDescription>Manila Materials Laboratory</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>Quezon City</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>5 days turnaround</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge variant="outline" className="text-xs border-gray-300">
                          ISO 17025
                        </Badge>
                        <Badge variant="outline" className="text-xs border-gray-300">
                          ASTM Compliant
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-gray-900">₱1,500</span>
                      <span className="text-gray-500 text-sm ml-1">per sample</span>
                    </div>
                    <Button size="sm" className="bg-teal-500 hover:bg-teal-600">
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button variant="outline" size="sm">
                Previous
              </Button>
              <Button variant="outline" size="sm" className="bg-teal-500 text-white hover:bg-teal-600">
                1
              </Button>
              <Button variant="outline" size="sm">
                2
              </Button>
              <Button variant="outline" size="sm">
                3
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
