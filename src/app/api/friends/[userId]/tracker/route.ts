import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - Récupérer le tracker d'un ami (seulement si amis)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: targetUserId } = await params
    const { searchParams } = new URL(request.url)
    const viewerId = searchParams.get('viewerId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Vérifier que l'utilisateur cible existe
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, pseudo: true, avatar: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Vérifier si le viewer est ami avec l'utilisateur cible
    // (ou si c'est lui-même)
    if (viewerId && viewerId !== targetUserId) {
      const isFriend = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userId: viewerId, friendId: targetUserId, status: 'accepted' },
            { userId: targetUserId, friendId: viewerId, status: 'accepted' },
          ],
        },
      })

      if (!isFriend) {
        return NextResponse.json({ 
          error: 'Vous devez être ami avec cet utilisateur pour voir son tracker' 
        }, { status: 403 })
      }
    } else if (!viewerId) {
      return NextResponse.json({ 
        error: 'Connexion requise pour voir ce tracker' 
      }, { status: 401 })
    }

    // Récupérer les catégories et habitudes
    const categories = await prisma.category.findMany({
      where: { userId: targetUserId },
      orderBy: { order: 'asc' },
      include: {
        habits: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
    })

    // Récupérer les logs pour la période demandée
    const logsWhere: any = { userId: targetUserId }
    if (startDate && endDate) {
      logsWhere.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const logs = await prisma.habitLog.findMany({
      where: logsWhere,
    })

    // Créer un map pour accès rapide aux logs
    const logsMap: Record<string, boolean> = {}
    logs.forEach(log => {
      const dateStr = log.date.toISOString().split('T')[0]
      logsMap[`${log.habitId}_${dateStr}`] = log.completed
    })

    return NextResponse.json({
      user,
      categories,
      logs: logsMap,
    })
  } catch (error) {
    console.error('Get friend tracker error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
