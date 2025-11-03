import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const quoteSchema = z.object({
  quotedPrice: z.number().positive('Price must be positive').max(1000000, 'Price cannot exceed ₱1,000,000'),
  estimatedTurnaroundDays: z.number().int('Turnaround days must be a whole number').positive().optional(),
  quoteNotes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
})

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Verify LAB_ADMIN role
    if (session.user.role !== 'LAB_ADMIN') {
      return NextResponse.json(
        { error: 'Only lab administrators can provide quotes' },
        { status: 403 }
      )
    }

    // 3. Parse and validate request body
    const body = await req.json()
    const validatedData = quoteSchema.parse(body)

    // 4. Fetch order with ownership check
    const order = await prisma.order.findFirst({
      where: {
        id: params.id,
        lab: {
          ownerId: session.user.id // ✅ Verify lab belongs to this user
        }
      },
      include: {
        lab: true,
        service: true,
        client: true
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or access denied' },
        { status: 404 }
      )
    }

    // 5. Verify order is in correct status
    if (order.status !== 'QUOTE_REQUESTED') {
      return NextResponse.json(
        { error: 'Quote can only be provided for orders with status QUOTE_REQUESTED' },
        { status: 400 }
      )
    }

    // 6. Update order with quote
    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: {
        quotedPrice: validatedData.quotedPrice,
        quotedAt: new Date(),
        status: 'QUOTE_PROVIDED',
        quoteNotes: validatedData.quoteNotes,
        estimatedTurnaroundDays: validatedData.estimatedTurnaroundDays
      },
      include: {
        service: true,
        lab: true,
        client: true
      }
    })

    return NextResponse.json(updatedOrder, { status: 200 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors
        },
        { status: 400 }
      )
    }

    console.error('Quote provision failed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
