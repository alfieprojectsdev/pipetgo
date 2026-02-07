import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const whereClause: {
      clientId?: string
      labId?: string
    } = {}

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
      } else {
        // LAB_ADMIN without a lab should see nothing
        return NextResponse.json({ total: 0, byStatus: {} })
      }
    } else if (session.user.role === 'ADMIN') {
      // ADMIN can see all orders (no additional filter)
    } else {
      // Any other role is unauthorized
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Group by status and count
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      where: whereClause,
      _count: {
        status: true
      }
    })

    // Transform to a map
    const stats: Record<string, number> = {}
    let total = 0

    statusCounts.forEach(item => {
      stats[item.status] = item._count.status
      total += item._count.status
    })

    return NextResponse.json({
      total,
      byStatus: stats
    })
  } catch (error) {
    console.error('Error fetching order stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
