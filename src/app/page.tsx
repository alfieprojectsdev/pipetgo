'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface LabService {
  id: string
  name: string
  description: string
  category: string
  pricePerUnit: number | null
  pricingMode: 'QUOTE_REQUIRED' | 'FIXED' | 'HYBRID'
  turnaroundDays: number
  lab: {
    name: string
    location: any
  }
}

function getPricingModeVariant(mode: string): 'info' | 'success' | 'default' {
  const variants = {
    'QUOTE_REQUIRED': 'info' as const,     // Blue
    'FIXED': 'success' as const,            // Green
    'HYBRID': 'default' as const            // Purple (will use default for now, updated in Task 5)
  }
  return variants[mode as keyof typeof variants] || 'default'
}

function getPricingModeLabel(mode: string): string {
  const labels = {
    'QUOTE_REQUIRED': 'Quote Required',
    'FIXED': 'Fixed Rate',
    'HYBRID': 'Flexible Pricing'
  }
  return labels[mode as keyof typeof labels] || mode
}

export default function Home() {
  const { data: session } = useSession()
  const router = useRouter()
  const [services, setServices] = useState<LabService[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services')
      if (response.ok) {
        const data = await response.json()
        setServices(data)
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOrderService = (serviceId: string) => {
    if (!session) {
      // Redirect to NextAuth's built-in signin page
      router.push('/api/auth/signin')
      return
    }
    router.push(`/order/${serviceId}`)
  }

  if (session) {
    // Redirect authenticated users to their dashboard
    const dashboardPath = session.user.role === 'ADMIN' 
      ? '/dashboard/admin' 
      : session.user.role === 'LAB_ADMIN' 
      ? '/dashboard/lab' 
      : '/dashboard/client'
    
    router.push(dashboardPath)
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">PipetGo</h1>
            <Button onClick={() => router.push('/api/auth/signin')}>
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Find the Right Lab for Your Testing Needs
          </h2>
          <p className="text-xl mb-8">
            Connect with certified laboratories for food safety, environmental, and chemical analysis
          </p>
          <Button 
            size="lg" 
            className="bg-white text-blue-600 hover:bg-gray-100"
            onClick={() => router.push('/api/auth/signin')}
          >
            Get Started
          </Button>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center mb-12">Available Lab Services</h3>
          
          {isLoading ? (
            <div className="text-center">Loading services...</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <Card key={service.id} className="h-full">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <div className="flex gap-2">
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {service.category}
                        </span>
                        <Badge variant={getPricingModeVariant(service.pricingMode)}>
                          {getPricingModeLabel(service.pricingMode)}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription className="text-sm text-gray-600">
                      {service.lab.name} • {service.lab.location?.city || 'Metro Manila'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4 line-clamp-3">
                      {service.description}
                    </p>

                    {service.pricingMode === 'QUOTE_REQUIRED' && (
                      <div className="text-gray-600 mb-4">
                        <p className="flex items-center gap-2">
                          <span className="text-blue-600">ℹ️</span>
                          Custom quote required
                        </p>
                        <p className="text-sm">Submit RFQ to get pricing</p>
                      </div>
                    )}

                    {service.pricingMode === 'FIXED' && (
                      <div className="mb-4">
                        <div className="flex justify-between">
                          <span className="font-medium">Price:</span>
                          <span className="text-xl font-bold text-green-600">
                            {formatCurrency(service.pricePerUnit!)} per sample
                          </span>
                        </div>
                      </div>
                    )}

                    {service.pricingMode === 'HYBRID' && service.pricePerUnit && (
                      <div className="text-gray-700 mb-4">
                        <p className="text-sm">
                          From <span className="font-bold">{formatCurrency(service.pricePerUnit)}</span> or request custom quote
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between mb-4">
                      <span className="font-medium">Turnaround:</span>
                      <span>{service.turnaroundDays} days</span>
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => handleOrderService(service.id)}
                    >
                      {service.pricingMode === 'QUOTE_REQUIRED'
                        ? 'Request Quote'
                        : service.pricingMode === 'HYBRID'
                        ? 'View Options'
                        : 'Book Service'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 PipetGo. Lab Services Marketplace MVP.</p>
        </div>
      </footer>
    </div>
  )
}