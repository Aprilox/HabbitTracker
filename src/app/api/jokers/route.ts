import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - Récupérer les stats de jokers pour un utilisateur
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 })
    }

    // Récupérer les settings utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        jokerCount: true,
        jokerPeriod: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Calculer la période
    const now = new Date()
    let startDate: Date

    switch (user.jokerPeriod) {
      case 'week':
        // Début de la semaine (lundi)
        startDate = new Date(now)
        const day = startDate.getDay()
        const diff = startDate.getDate() - day + (day === 0 ? -6 : 1)
        startDate.setDate(diff)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'month':
        // Début du mois
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'year':
        // Début de l'année
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now)
        const d = startDate.getDay()
        const diff2 = startDate.getDate() - d + (d === 0 ? -6 : 1)
        startDate.setDate(diff2)
        startDate.setHours(0, 0, 0, 0)
    }

    // Compter les jokers utilisés dans la période
    const jokersUsed = await prisma.habitLog.count({
      where: {
        userId,
        isJoker: true,
        date: {
          gte: startDate,
        },
      },
    })

    const jokersRemaining = Math.max(0, user.jokerCount - jokersUsed)

    return NextResponse.json({
      jokerCount: user.jokerCount,
      jokerPeriod: user.jokerPeriod,
      jokersUsed,
      jokersRemaining,
    })
  } catch (error) {
    console.error('Get jokers error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

