import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createOrderSchema = z.object({
  serviceId: z.string(),
  sampleDescription: z.string().min(10),
  specialInstructions: z.string().optional(),
  clientDetails: z.object({
    contactEmail: z.string().email(),
    contactPhone: z.string().optional(),
    shippingAddress: z.object({
      street: z.string(),
      city: z.string(),
      postal: z.string(),
      country: z.string().default('Philippines')
    }),
    organization: z.string().optional()
  })
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createOrderSchema.parse(body)

    // Get service and lab details
    const service = await prisma.labService.findUnique({
      where: { id: validatedData.serviceId },
      include: { lab: true }
    })

    if (!service || !service.active) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    const order = await prisma.order.create({
      data: {
        clientId: session.user.id,
        labId: service.labId,
        serviceId: service.id,
        sampleDescription: validatedData.sampleDescription,
        specialInstructions: validatedData.specialInstructions,
        clientDetails: validatedData.clientDetails,
        quotedPrice: service.pricePerUnit,
      },
      include: {
        service: true,
        lab: { select: { name: true } },
        client: { select: { name: true, email: true } }
      }
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')

    let whereClause: any = {}

    // Filter based on user role
    if (session.user.role === 'CLIENT') {
      whereClause.clientId = session.user.id
    } else if (session.user.role === 'LAB_ADMIN') {
      // Get lab owned by this user
      const lab = await prisma.lab.findFirst({
        where: { ownerId: session.user.id }
      })
      if (lab) {
        whereClause.labId = lab.id
      }
    }
    // ADMIN can see all orders (no additional filter)

    if (status) {
      whereClause.status = status
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        service: { select: { name: true, category: true } },
        lab: { select: { name: true } },
        client: { select: { name: true, email: true } },
        attachments: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}