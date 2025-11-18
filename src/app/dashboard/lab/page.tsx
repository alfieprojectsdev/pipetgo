'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from '@/lib/toast'

interface Order {
  id: string
  status: string
  createdAt: string
  sampleDescription: string
  specialInstructions?: string
  quotedPrice?: number
  client: { name: string; email: string }
  service: { name: string; category: string }
  clientDetails: any
  attachments: any[]
}

export default function LabDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'LAB_ADMIN') {
      router.push('/auth/signin')
      return
    }
    fetchOrders()
  }, [session, status, router])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string, withResults = false) => {
    setUpdatingOrder(orderId)

    try {
      const updateData: any = { status: newStatus }

      // Mock file upload for results
      if (withResults) {
        updateData.resultFileUrl = `https://example.com/results/${orderId}.pdf`
        updateData.resultFileName = `Test_Results_${orderId.substring(0, 8)}.pdf`
      }

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        toast.success('Order updated', 'Status has been changed successfully')
        fetchOrders() // Refresh orders
      } else {
        toast.error('Failed to update order', 'Please try again')
      }
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('An error occurred', 'Please try again')
    } finally {
      setUpdatingOrder(null)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      QUOTE_REQUESTED: 'bg-yellow-100 text-yellow-900',
      QUOTE_PROVIDED: 'bg-blue-100 text-blue-900',
      QUOTE_REJECTED: 'bg-red-100 text-red-900',
      PENDING: 'bg-yellow-100 text-yellow-900',
      ACKNOWLEDGED: 'bg-blue-100 text-blue-900',
      IN_PROGRESS: 'bg-purple-100 text-purple-900',
      COMPLETED: 'bg-green-100 text-green-900',
      CANCELLED: 'bg-red-100 text-red-900'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-900'
  }

  const getNextActions = (order: Order) => {
    switch (order.status) {
      case 'QUOTE_REQUESTED':
        return (
          <Button
            size="sm"
            onClick={() => window.location.href = `/dashboard/lab/orders/${order.id}/quote`}
          >
            Provide Quote
          </Button>
        )
      case 'PENDING':
        return (
          <Button
            size="sm"
            onClick={() => updateOrderStatus(order.id, 'ACKNOWLEDGED')}
            disabled={updatingOrder === order.id}
          >
            {updatingOrder === order.id ? 'Acknowledging...' : 'Acknowledge Order'}
          </Button>
        )
      case 'ACKNOWLEDGED':
        return (
          <Button
            size="sm"
            onClick={() => updateOrderStatus(order.id, 'IN_PROGRESS')}
            disabled={updatingOrder === order.id}
          >
            {updatingOrder === order.id ? 'Starting...' : 'Start Testing'}
          </Button>
        )
      case 'IN_PROGRESS':
        return (
          <Button
            size="sm"
            onClick={() => updateOrderStatus(order.id, 'COMPLETED', true)}
            disabled={updatingOrder === order.id}
          >
            {updatingOrder === order.id ? 'Uploading...' : 'Upload Results'}
          </Button>
        )
      default:
        return null
    }
  }

  if (status === 'loading' || isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lab Dashboard</h1>
              <p className="text-gray-600">Metro Manila Testing Laboratory</p>
            </div>
            <Button
              variant="outline"
              onClick={() => signOut({ callbackUrl: '/' })}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {orders.length}
              </div>
              <p className="text-sm text-gray-600">Total Orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">
                {orders.filter(o => o.status === 'PENDING').length}
              </div>
              <p className="text-sm text-gray-600">New Requests</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">
                {orders.filter(o => o.status === 'IN_PROGRESS').length}
              </div>
              <p className="text-sm text-gray-600">In Progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {orders.filter(o => o.status === 'COMPLETED').length}
              </div>
              <p className="text-sm text-gray-600">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>

          {orders.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500">No orders yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{order.service.name}</CardTitle>
                        <CardDescription>
                          Client: {order.client.name} ({order.client.email})
                        </CardDescription>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                        role="status"
                        aria-label={`Order status: ${order.status.replace('_', ' ')}`}
                      >
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Sample Description</p>
                        <p className="font-medium">{order.sampleDescription}</p>
                        {order.specialInstructions && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">Special Instructions</p>
                            <p className="text-sm">{order.specialInstructions}</p>
                          </div>
                        )}
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Order Date</p>
                          <p className="font-medium">{formatDate(order.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Quoted Price</p>
                          <p className="font-medium">
                            {order.quotedPrice ? formatCurrency(order.quotedPrice) : 'Not set'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Shipping Address</p>
                          <p className="text-sm">
                            {order.clientDetails?.shippingAddress?.city || 'Not provided'}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <div className="text-sm text-gray-500">
                          Order #{order.id.substring(0, 8)}
                        </div>
                        {getNextActions(order)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
