'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface LabService {
  id: string
  name: string
  description: string
  category: string
  pricePerUnit: number
  turnaroundDays: number
  sampleRequirements: string
  lab: {
    name: string
    location: any
    certifications: string[]
  }
}

export default function OrderPage({ params }: { params: { serviceId: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [service, setService] = useState<LabService | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    sampleDescription: '',
    specialInstructions: '',
    contactEmail: '',
    contactPhone: '',
    organization: '',
    street: '',
    city: '',
    postal: '',
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'CLIENT') {
      router.push('/auth/signin')
      return
    }
    fetchService()
  }, [session, status, router, params.serviceId])

  const fetchService = async () => {
    try {
      const response = await fetch(`/api/services?serviceId=${params.serviceId}`)
      if (response.ok) {
        const services = await response.json()
        const foundService = services.find((s: LabService) => s.id === params.serviceId)
        if (foundService) {
          setService(foundService)
          setFormData(prev => ({ ...prev, contactEmail: session?.user?.email || '' }))
        } else {
          router.push('/')
        }
      }
    } catch (error) {
      console.error('Error fetching service:', error)
      router.push('/')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const orderData = {
        serviceId: params.serviceId,
        sampleDescription: formData.sampleDescription,
        specialInstructions: formData.specialInstructions,
        clientDetails: {
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          organization: formData.organization,
          shippingAddress: {
            street: formData.street,
            city: formData.city,
            postal: formData.postal,
            country: 'Philippines'
          }
        }
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      if (response.ok) {
        alert('Order submitted successfully!')
        router.push('/dashboard/client')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error submitting order:', error)
      alert('An error occurred while submitting the order')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!service) {
    return <div className="flex items-center justify-center min-h-screen">Service not found</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button variant="outline" onClick={() => router.back()}>
            ← Back
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Service Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{service.name}</CardTitle>
              <CardDescription>{service.lab.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">Description</h4>
                <p className="text-gray-700">{service.description}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900">Sample Requirements</h4>
                <p className="text-gray-700">{service.sampleRequirements}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">Price</h4>
                  <p className="text-lg font-semibold text-blue-600">
                    {formatCurrency(service.pricePerUnit)} per sample
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Turnaround</h4>
                  <p className="text-lg font-semibold">{service.turnaroundDays} days</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900">Lab Location</h4>
                <p className="text-gray-700">{service.lab.location?.city || 'Metro Manila'}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900">Certifications</h4>
                <div className="flex flex-wrap gap-2 mt-1">
                  {service.lab.certifications.map((cert) => (
                    <span key={cert} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Form */}
          <Card>
            <CardHeader>
              <CardTitle>Submit Test Request</CardTitle>
              <CardDescription>Provide details about your sample and shipping information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Sample Description *
                  </label>
                  <textarea
                    value={formData.sampleDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, sampleDescription: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Describe your sample (e.g., Coconut oil from batch #123, suspected contamination)"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Special Instructions
                  </label>
                  <textarea
                    value={formData.specialInstructions}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Any special handling requirements or notes"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Contact Email *
                    </label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+63917123456"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Organization
                  </label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Company or institution name"
                  />
                </div>

                <div>
                  <h4 className="font-medium mb-2">Shipping Address</h4>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={formData.street}
                      onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Street address *"
                      required
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="City *"
                        required
                      />
                      <input
                        type="text"
                        value={formData.postal}
                        onChange={(e) => setFormData(prev => ({ ...prev, postal: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Postal code *"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting Request...' : 'Submit Test Request'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}