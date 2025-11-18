import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const DEFAULT_PAGE_SIZE = 12
const MAX_PAGE_SIZE = 50

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parse pagination params
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE)))
    )
    const skip = (page - 1) * pageSize

    // Parse filter params
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const format = searchParams.get('format') // 'legacy' or null

    // Build where clause
    const where = {
      active: true,
      ...(category && { category }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ]
      })
    }

    // Execute queries in parallel
    const [items, totalCount] = await Promise.all([
      prisma.labService.findMany({
        where,
        include: {
          lab: {
            select: {
              id: true,
              name: true,
              location: true,
              certifications: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: pageSize,
      }),
      prisma.labService.count({ where })
    ])

    const totalPages = Math.ceil(totalCount / pageSize)

    // Backward compatibility
    if (format === 'legacy') {
      return NextResponse.json(items)
    }

    return NextResponse.json({
      items,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasMore: page < totalPages
      }
    })
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
