'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.ok) {
        const session = await getSession()
        // Redirect based on user role
        if (session?.user?.role === 'ADMIN') {
          router.push('/dashboard/admin')
        } else if (session?.user?.role === 'LAB_ADMIN') {
          router.push('/dashboard/lab')
        } else {
          router.push('/dashboard/client')
        }
      } else {
        alert('Invalid email or password. Please check your credentials and try again.')
      }
    } catch (error) {
      console.error('Sign in error:', error)
      alert('An error occurred during sign in.')
    } finally {
      setIsLoading(false)
    }
  }

  const demoAccounts = [
    { email: 'client@example.com', role: 'Client', description: 'Maria Santos' },
    { email: 'lab@testinglab.com', role: 'Lab Admin', description: 'Metro Manila Testing Lab' },
    { email: 'lab2@chempro.com', role: 'Lab Admin', description: 'Chempro Analytical' },
    { email: 'lab3@eurofins.com', role: 'Lab Admin', description: 'Eurofins Philippines' },
    { email: 'lab4@intertek.com', role: 'Lab Admin', description: 'Intertek Makati' },
    { email: 'admin@pipetgo.com', role: 'Platform Admin', description: 'System Administrator' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">PipetGo!</CardTitle>
          <CardDescription className="text-center">
            Lab Services Marketplace - MVP Demo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">Demo Accounts:</h3>
            <p className="text-xs text-gray-600 mb-2">
              Click to fill email. Password required for secure login.
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  onClick={() => setEmail(account.email)}
                  className="w-full text-left p-2 text-sm border rounded hover:bg-gray-50 hover:border-green-500 transition-colors"
                >
                  <div className="font-medium text-gray-900">{account.role}</div>
                  <div className="text-xs text-gray-600">{account.description}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{account.email}</div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}