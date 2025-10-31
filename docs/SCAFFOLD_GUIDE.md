# PipetGo MVP - Complete Scaffold Guide

This document provides a comprehensive guide to implementing all remaining Stage 1 MVP components.

## ✅ Already Completed

1. **Types & Interfaces** (`src/types/index.ts`)
2. **Validation Schemas** (`src/lib/validations/`)
   - auth.ts
   - order.ts
   - service.ts
   - lab.ts
3. **Core Utilities** (`src/lib/`)
   - auth.ts (NextAuth configuration)
   - db.ts (Prisma singleton)
   - utils.ts (Helper functions)
   - hooks/useOrders.ts (Order data fetching)

## 📋 Remaining Implementation Tasks

### Phase 1: Base UI Components (`src/components/ui/`)

These are reusable, generic UI primitives following shadcn/ui patterns.

#### 1. Input Component (`src/components/ui/input.tsx`)
```typescript
/**
 * 🎓 LEARNING: Input Component
 * Base text input with consistent styling
 */
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLHTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2',
          'text-sm placeholder:text-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
```

#### 2. Label Component (`src/components/ui/label.tsx`)
```typescript
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'text-sm font-medium text-gray-700 leading-none',
          'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          className
        )}
        {...props}
      />
    )
  }
)
Label.displayName = 'Label'

export { Label }
```

#### 3. Textarea Component (`src/components/ui/textarea.tsx`)
```typescript
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2',
          'text-sm placeholder:text-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
```

#### 4. Select Component (`src/components/ui/select.tsx`)
```typescript
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2',
          'text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = 'Select'

export { Select }
```

#### 5. Badge Component (`src/components/ui/badge.tsx`)
```typescript
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-800 border-gray-200',
        success: 'bg-green-100 text-green-800 border-green-200',
        warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        error: 'bg-red-100 text-red-800 border-red-200',
        info: 'bg-blue-100 text-blue-800 border-blue-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
```

#### 6. Alert Component (`src/components/ui/alert.tsx`)
```typescript
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const alertVariants = cva(
  'relative w-full rounded-lg border p-4',
  {
    variants: {
      variant: {
        default: 'bg-white text-gray-900 border-gray-200',
        destructive: 'bg-red-50 text-red-900 border-red-200',
        success: 'bg-green-50 text-green-900 border-green-200',
        warning: 'bg-yellow-50 text-yellow-900 border-yellow-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = 'Alert'

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-medium leading-none tracking-tight', className)}
    {...props}
  />
))
AlertTitle.displayName = 'AlertTitle'

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
))
AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertTitle, AlertDescription }
```

### Phase 2: Feature Components (`src/components/features/`)

#### 1. Order Status Badge (`src/components/features/orders/order-status-badge.tsx`)
```typescript
/**
 * 🎓 LEARNING: Order Status Badge
 * Displays order status with appropriate color coding
 */
'use client'

import { Badge } from '@/components/ui/badge'
import { OrderStatus } from '@/types'
import { getStatusDisplayName, getStatusColor } from '@/lib/utils'

interface OrderStatusBadgeProps {
  status: OrderStatus
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <Badge className={getStatusColor(status)}>
      {getStatusDisplayName(status)}
    </Badge>
  )
}
```

#### 2. Order Card (`src/components/features/orders/order-card.tsx`)
```typescript
/**
 * 🎓 LEARNING: Order Card Component
 * Displays order summary in a card format
 */
'use client'

import { Card } from '@/components/ui/card'
import { OrderStatusBadge } from './order-status-badge'
import { Order } from '@/types'
import { formatDate, formatCurrency } from '@/lib/utils'
import Link from 'next/link'

interface OrderCardProps {
  order: Order
}

export function OrderCard({ order }: OrderCardProps) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold text-lg">
            {order.service?.name || 'Service'}
          </h3>
          <p className="text-sm text-gray-600">
            Order #{order.id.slice(0, 8)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Lab:</span>
          <span>{order.lab?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Submitted:</span>
          <span>{formatDate(order.createdAt)}</span>
        </div>
        {order.quotedPrice && (
          <div className="flex justify-between">
            <span className="text-gray-600">Price:</span>
            <span className="font-medium">{formatCurrency(order.quotedPrice)}</span>
          </div>
        )}
      </div>

      {/* TODO: Add view details link */}
      <Link
        href={`/dashboard/orders/${order.id}`}
        className="mt-4 block text-center text-sm text-blue-600 hover:text-blue-800"
      >
        View Details →
      </Link>
    </Card>
  )
}
```

#### 3. Service Card (`src/components/features/services/service-card.tsx`)
```typescript
/**
 * 🎓 LEARNING: Service Card
 * Displays lab service in catalog view
 */
'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LabService } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface ServiceCardProps {
  service: LabService & { lab?: { name: string } }
}

export function ServiceCard({ service }: ServiceCardProps) {
  const router = useRouter()

  const handleRequestTest = () => {
    // TODO: Check authentication first
    router.push(`/order/${service.id}`)
  }

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow h-full flex flex-col">
      <div className="flex-1">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg">{service.name}</h3>
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
            {service.category}
          </span>
        </div>

        <p className="text-sm text-gray-600 mb-2">{service.lab?.name}</p>

        <p className="text-sm text-gray-700 mb-4 line-clamp-3">
          {service.description || 'No description available'}
        </p>

        <div className="space-y-1 text-sm">
          {service.pricePerUnit && (
            <div className="flex justify-between">
              <span className="text-gray-600">Price:</span>
              <span className="font-medium">{formatCurrency(service.pricePerUnit)}</span>
            </div>
          )}
          {service.turnaroundDays && (
            <div className="flex justify-between">
              <span className="text-gray-600">Turnaround:</span>
              <span>{service.turnaroundDays} days</span>
            </div>
          )}
        </div>
      </div>

      <Button
        onClick={handleRequestTest}
        className="w-full mt-4"
      >
        Request Test
      </Button>
    </Card>
  )
}
```

### Phase 3: API Routes (`src/app/api/`)

All API routes follow this pattern:

#### Standard API Route Structure
```typescript
/**
 * 🎓 LEARNING: API Route Pattern
 * =============================
 * 1. Import dependencies (NextResponse, getServerSession, prisma, schemas)
 * 2. Implement GET/POST/PATCH/DELETE handlers
 * 3. Check authentication
 * 4. Validate request body with Zod
 * 5. Execute database operations
 * 6. Return standardized JSON response
 * 7. Handle errors with try-catch
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createOrderSchema } from '@/lib/validations/order'

export async function GET(request: NextRequest) {
  try {
    // 1. Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse query params (if needed)
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // 3. Build where clause based on user role
    const where: any = {}
    if (session.user.role === 'CLIENT') {
      where.clientId = session.user.id
    } else if (session.user.role === 'LAB_ADMIN') {
      // TODO: Get lab ID from user
      // where.labId = user.ownedLabs[0].id
    }

    if (status) {
      where.status = status
    }

    // 4. Fetch data with relations
    const orders = await prisma.order.findMany({
      where,
      include: {
        client: { select: { name: true, email: true } },
        lab: { select: { name: true } },
        service: { select: { name: true, category: true } },
        attachments: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // 5. Return success response
    return NextResponse.json({ data: orders }, { status: 200 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse and validate request body
    const body = await request.json()
    const validation = createOrderSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const data = validation.data

    // 3. Fetch service to get lab ID
    const service = await prisma.labService.findUnique({
      where: { id: data.serviceId }
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // 4. Create order
    const order = await prisma.order.create({
      data: {
        clientId: session.user.id,
        serviceId: data.serviceId,
        labId: service.labId,
        status: 'PENDING',
        clientDetails: data.clientDetails,
        sampleDescription: data.sampleDescription,
        specialInstructions: data.specialInstructions
      },
      include: {
        service: true,
        lab: true
      }
    })

    // TODO: Send email notification to lab

    // 5. Return created order
    return NextResponse.json({ data: order }, { status: 201 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Phase 4: Dashboard Pages

#### Client Dashboard (`src/app/dashboard/client/page.tsx`)
```typescript
/**
 * 🎓 LEARNING: Client Dashboard
 * =============================
 * Server component that fetches user's orders and displays them
 */
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { OrderCard } from '@/components/features/orders/order-card'

export default async function ClientDashboard() {
  // 1. Check authentication
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  if (session.user.role !== 'CLIENT') {
    redirect('/dashboard') // Redirect to appropriate dashboard
  }

  // 2. Fetch user's orders
  const orders = await prisma.order.findMany({
    where: { clientId: session.user.id },
    include: {
      lab: { select: { name: true } },
      service: { select: { name: true, category: true } },
      attachments: true
    },
    orderBy: { createdAt: 'desc' }
  })

  // 3. Calculate stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'PENDING').length,
    completed: orders.filter(o => o.status === 'COMPLETED').length,
    totalSpent: orders
      .filter(o => o.quotedPrice)
      .reduce((sum, o) => sum + Number(o.quotedPrice), 0)
  }

  // 4. Render dashboard
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total Orders</p>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Pending</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Completed</p>
          <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total Spent</p>
          <p className="text-2xl font-bold">₱{stats.totalSpent.toFixed(2)}</p>
        </div>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No orders yet</p>
          <a href="/" className="text-blue-600 hover:underline">
            Browse services →
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}
```

### Phase 5: Order Submission Flow

#### Order Form Page (`src/app/order/[serviceId]/page.tsx`)
```typescript
/**
 * 🎓 LEARNING: Order Submission Page
 * ==================================
 * Multi-step form for submitting test requests
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createOrderSchema, type CreateOrderInput } from '@/lib/validations/order'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface OrderFormProps {
  params: { serviceId: string }
}

export default function OrderForm({ params }: OrderFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<CreateOrderInput>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      serviceId: params.serviceId,
      sampleDescription: '',
      specialInstructions: '',
      clientDetails: {
        name: '',
        email: '',
        phone: '',
        organization: '',
        address: ''
      }
    }
  })

  const onSubmit = async (data: CreateOrderInput) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit order')
      }

      const result = await response.json()

      // TODO: Show success message
      router.push(`/dashboard/client`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Request Test</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Sample Description */}
        <div>
          <Label htmlFor="sampleDescription">Sample Description *</Label>
          <Textarea
            id="sampleDescription"
            {...form.register('sampleDescription')}
            placeholder="Describe your sample in detail..."
            rows={4}
          />
          {form.formState.errors.sampleDescription && (
            <p className="text-red-600 text-sm mt-1">
              {form.formState.errors.sampleDescription.message}
            </p>
          )}
        </div>

        {/* Special Instructions */}
        <div>
          <Label htmlFor="specialInstructions">Special Instructions</Label>
          <Textarea
            id="specialInstructions"
            {...form.register('specialInstructions')}
            placeholder="Any special handling or requirements..."
            rows={3}
          />
        </div>

        {/* Client Details */}
        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Contact Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientDetails.name">Name *</Label>
              <Input
                id="clientDetails.name"
                {...form.register('clientDetails.name')}
              />
              {form.formState.errors.clientDetails?.name && (
                <p className="text-red-600 text-sm mt-1">
                  {form.formState.errors.clientDetails.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="clientDetails.email">Email *</Label>
              <Input
                id="clientDetails.email"
                type="email"
                {...form.register('clientDetails.email')}
              />
              {form.formState.errors.clientDetails?.email && (
                <p className="text-red-600 text-sm mt-1">
                  {form.formState.errors.clientDetails.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="clientDetails.phone">Phone *</Label>
              <Input
                id="clientDetails.phone"
                type="tel"
                {...form.register('clientDetails.phone')}
              />
              {form.formState.errors.clientDetails?.phone && (
                <p className="text-red-600 text-sm mt-1">
                  {form.formState.errors.clientDetails.phone.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="clientDetails.organization">Organization</Label>
              <Input
                id="clientDetails.organization"
                {...form.register('clientDetails.organization')}
              />
            </div>
          </div>

          <div className="mt-4">
            <Label htmlFor="clientDetails.address">Address</Label>
            <Textarea
              id="clientDetails.address"
              {...form.register('clientDetails.address')}
              rows={2}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Submitting...' : 'Submit Order'}
          </Button>
        </div>
      </form>
    </div>
  )
}
```

### Phase 6: Prisma Seed Script

Complete seed implementation in `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs' // TODO: Install for Stage 2

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // 1. Create users
  const client = await prisma.user.upsert({
    where: { email: 'client@example.com' },
    update: {},
    create: {
      email: 'client@example.com',
      name: 'John Doe',
      role: 'CLIENT'
    }
  })

  const labAdmin = await prisma.user.upsert({
    where: { email: 'lab@testinglab.com' },
    update: {},
    create: {
      email: 'lab@testinglab.com',
      name: 'Testing Lab Admin',
      role: 'LAB_ADMIN'
    }
  })

  const admin = await prisma.user.upsert({
    where: { email: 'admin@pipetgo.com' },
    update: {},
    create: {
      email: 'admin@pipetgo.com',
      name: 'Platform Admin',
      role: 'ADMIN'
    }
  })

  // 2. Create lab
  const lab = await prisma.lab.upsert({
    where: { id: 'lab-1' },
    update: {},
    create: {
      id: 'lab-1',
      ownerId: labAdmin.id,
      name: 'Manila Testing Laboratory',
      description: 'Full-service laboratory for all testing needs',
      location: {
        address: '123 Science Avenue',
        city: 'Manila',
        state: 'Metro Manila',
        country: 'Philippines',
        postalCode: '1000'
      },
      certifications: ['ISO 17025', 'FDA Accredited']
    }
  })

  // 3. Create services
  const services = await Promise.all([
    prisma.labService.create({
      data: {
        labId: lab.id,
        name: 'Water Quality Testing',
        description: 'Comprehensive water analysis',
        category: 'Water Testing',
        pricePerUnit: 500,
        turnaroundDays: 3,
        active: true
      }
    }),
    prisma.labService.create({
      data: {
        labId: lab.id,
        name: 'Soil Analysis',
        description: 'Complete soil composition testing',
        category: 'Soil Analysis',
        pricePerUnit: 800,
        turnaroundDays: 5,
        active: true
      }
    })
  ])

  // 4. Create sample orders
  await prisma.order.create({
    data: {
      clientId: client.id,
      labId: lab.id,
      serviceId: services[0].id,
      status: 'PENDING',
      clientDetails: {
        name: 'John Doe',
        email: 'client@example.com',
        phone: '+63 912 345 6789'
      },
      sampleDescription: 'Water sample from residential well',
      quotedPrice: 500
    }
  })

  console.log('✅ Seeding completed')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

## 🚀 Next Steps for Implementation

1. **Create all base UI components** (Input, Label, Textarea, Select, Badge, Alert)
2. **Implement feature components** (OrderCard, ServiceCard, OrderStatusBadge)
3. **Complete all API routes** following the standard pattern
4. **Build dashboard pages** for each role (client, lab, admin)
5. **Create order submission flow** with form validation
6. **Implement homepage** with service catalog
7. **Complete seed script** with comprehensive test data
8. **Test end-to-end flow**: Signup → Browse → Order → Lab processes → Client sees results

## 📚 Learning Resources

- **Next.js App Router**: https://nextjs.org/docs/app
- **Prisma Documentation**: https://www.prisma.io/docs
- **NextAuth.js Guide**: https://next-auth.js.org/
- **Zod Validation**: https://zod.dev/
- **React Hook Form**: https://react-hook-form.com/

## ⚠️ Common Pitfalls to Avoid

1. Don't create multiple Prisma Client instances
2. Always validate user input with Zod schemas
3. Check authentication in ALL API routes
4. Use proper TypeScript types (avoid `any`)
5. Handle loading and error states in UI
6. Test order status transitions carefully
7. Remember this is MVP - keep features simple

---

**Last Updated**: 2025-10-10
**Document Version**: 1.0
