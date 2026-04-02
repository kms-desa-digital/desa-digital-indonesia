import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const desaId = searchParams.get('desaId')

    const db = await connectToDatabase()
    const filter: Record<string, any> = {}

    if (desaId) {
      filter.desaId = desaId
    }

    const [
      totalVillages,
      totalInnovations,
      totalClaimedInnovations,
      uniqueInnovators,
    ] = await Promise.all([
      db.collection('villages').countDocuments(),
      db.collection('innovations').countDocuments(),
      db.collection('claimInnovations').countDocuments(filter),
      db.collection('claimInnovations').distinct('inovatorId', filter),
    ])

    return NextResponse.json(
      {
        dashboard: {
          totalVillages,
          totalInnovations,
          totalClaimedInnovations,
          totalInnovators: Array.isArray(uniqueInnovators) ? uniqueInnovators.length : 0,
          filteredBy: desaId ? { desaId } : null,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching village dashboard:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
