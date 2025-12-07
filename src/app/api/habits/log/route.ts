import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - Récupérer les logs d'habitudes pour une période
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 })
    }

    const where: any = { userId }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const logs = await prisma.habitLog.findMany({
      where,
      include: { habit: true },
    })

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Get habit logs error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer ou mettre à jour un log d'habitude (toggle)
export async function POST(request: NextRequest) {
  try {
    const { userId, habitId, date, completed, count, isJoker } = await request.json()

    if (!userId || !habitId || !date) {
      return NextResponse.json({ error: 'userId, habitId et date requis' }, { status: 400 })
    }

    // Parser la date en local (éviter les problèmes de timezone)
    // Si la date est au format 'YYYY-MM-DD', la parser correctement
    let dateObj: Date
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      // Format YYYY-MM-DD -> créer la date en local puis convertir en UTC minuit
      const [year, month, day] = date.split('-').map(Number)
      dateObj = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
    } else {
      dateObj = new Date(date)
      dateObj.setUTCHours(0, 0, 0, 0)
    }

    // Chercher un log existant
    const existingLog = await prisma.habitLog.findUnique({
      where: {
        habitId_date: {
          habitId,
          date: dateObj,
        },
      },
    })

    let log

    if (existingLog) {
      // Toggle ou mise à jour
      log = await prisma.habitLog.update({
        where: { id: existingLog.id },
        data: {
          completed: completed !== undefined ? completed : !existingLog.completed,
          count: count !== undefined ? count : existingLog.count,
          isJoker: isJoker !== undefined ? isJoker : existingLog.isJoker,
        },
      })
    } else {
      // Créer un nouveau log
      log = await prisma.habitLog.create({
        data: {
          habitId,
          userId,
          date: dateObj,
          completed: completed !== undefined ? completed : true,
          count: count || null,
          isJoker: isJoker || false,
        },
      })
    }

    return NextResponse.json({ log })
  } catch (error) {
    console.error('Toggle habit log error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

