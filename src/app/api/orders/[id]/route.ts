import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateOrderSchema = z.object({
  status: z.enum(['ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  resultFileUrl: z.string().url().optional(),
  resultFileName: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateOrderSchema.parse(body)

    // Check if user can update this order
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { lab: true }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Lab admin can update orders for their lab, admin can update any order
    const canUpdate = 
      session.user.role === 'ADMIN' || 
      (session.user.role === 'LAB_ADMIN' && order.lab.ownerId === session.user.id)

    if (!canUpdate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updateData: any = {
      status: validatedData.status,
      updatedAt: new Date(),
    }

    // Set timestamps based on status
    if (validatedData.status === 'ACKNOWLEDGED') {
      updateData.acknowledgedAt = new Date()
    } else if (validatedData.status === 'COMPLETED') {
      updateData.completedAt = new Date()
    }

    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
      include: {
        service: { select: { name: true } },
        lab: { select: { name: true } },
        client: { select: { name: true, email: true } }
      }
    })

    // If result file provided, create attachment
    if (validatedData.resultFileUrl && validatedData.resultFileName) {
      await prisma.attachment.create({
        data: {
          orderId: params.id,
          uploadedById: session.user.id,
          fileName: validatedData.resultFileName,
          fileUrl: validatedData.resultFileUrl,
          fileType: 'application/pdf',
          attachmentType: 'result'
        }
      })
    }

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Error updating order:', error)
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