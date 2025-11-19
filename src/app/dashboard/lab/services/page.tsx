'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default function ServicesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session || session.user.role !== 'LAB_ADMIN') {
      router.push('/auth/signin')
      return
    }

    setIsLoading(false)
  }, [session, status, router])

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Services</h1>
              <p className="text-gray-600">Create and manage your lab's service catalog</p>
            </div>
            <Button onClick={() => alert('Create service modal coming soon')}>
              Add Service
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Empty state */}
        <Card>
          <CardHeader>
            <CardTitle>No services yet</CardTitle>
            <CardDescription>
              Add your first service to start receiving quote requests from clients.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-12">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No services</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new service.
              </p>
              <div className="mt-6">
                <Button onClick={() => alert('Create service modal coming soon')}>
                  Add Service
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
