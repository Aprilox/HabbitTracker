import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - Récupérer la liste des amis, demandes en attente, ou rechercher des utilisateurs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') || 'friends' // 'friends', 'pending', 'search'
    const search = searchParams.get('search') // Pour la recherche par pseudo

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 })
    }

    // Recherche d'utilisateurs par pseudo
    if (type === 'search' && search) {
      // Chercher tous les utilisateurs puis filtrer (SQLite ne supporte pas bien mode: insensitive)
      const allUsers = await prisma.user.findMany({
        where: {
          NOT: { id: userId }, // Exclure soi-même
        },
        select: {
          id: true,
          pseudo: true,
          avatar: true,
        },
      })
      
      // Filtrer par pseudo (insensible à la casse)
      const searchLower = search.toLowerCase()
      const users = allUsers
        .filter(u => u.pseudo.toLowerCase().includes(searchLower))
        .slice(0, 10)

      // Récupérer les relations existantes pour savoir qui est déjà ami ou en attente
      const existingRelations = await prisma.friendship.findMany({
        where: {
          OR: [
            { userId, friendId: { in: users.map(u => u.id) } },
            { friendId: userId, userId: { in: users.map(u => u.id) } },
          ],
        },
      })

      // Ajouter le statut de relation à chaque utilisateur
      const usersWithStatus = users.map(user => {
        const relation = existingRelations.find(
          r => (r.userId === userId && r.friendId === user.id) ||
               (r.friendId === userId && r.userId === user.id)
        )
        return {
          ...user,
          relationStatus: relation?.status || null,
          isRequester: relation?.userId === userId,
        }
      })

      return NextResponse.json({ users: usersWithStatus })
    }

    if (type === 'pending') {
      // Demandes d'amis en attente reçues
      const pending = await prisma.friendship.findMany({
        where: {
          friendId: userId,
          status: 'pending',
        },
        include: {
          user: {
            select: { id: true, pseudo: true, avatar: true },
          },
        },
      })

      return NextResponse.json({ pending })
    }

    // Liste des amis acceptés
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId, status: 'accepted' },
          { friendId: userId, status: 'accepted' },
        ],
      },
      include: {
        user: { select: { id: true, pseudo: true, avatar: true } },
        friend: { select: { id: true, pseudo: true, avatar: true } },
      },
    })

    // Extraire les amis (l'autre personne dans la relation)
    const friends = friendships.map(f => 
      f.userId === userId ? f.friend : f.user
    )

    // Récupérer aussi les demandes reçues en attente pour le badge de notification
    const receivedRequests = await prisma.friendship.findMany({
      where: {
        friendId: userId,
        status: 'pending',
      },
      include: {
        user: { select: { id: true, pseudo: true, avatar: true } },
      },
    })

    return NextResponse.json({ friends, receivedRequests })
  } catch (error) {
    console.error('Get friends error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Envoyer une demande d'ami
export async function POST(request: NextRequest) {
  try {
    const { userId, friendId } = await request.json()

    if (!userId || !friendId) {
      return NextResponse.json({ error: 'userId et friendId requis' }, { status: 400 })
    }

    if (userId === friendId) {
      return NextResponse.json({ error: 'Impossible de s\'ajouter soi-même' }, { status: 400 })
    }

    // Vérifier que l'ami existe
    const friendExists = await prisma.user.findUnique({ where: { id: friendId } })
    if (!friendExists) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Vérifier si une relation existe déjà
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    })

    if (existing) {
      if (existing.status === 'accepted') {
        return NextResponse.json({ error: 'Vous êtes déjà amis' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Demande déjà envoyée' }, { status: 409 })
    }

    const friendship = await prisma.friendship.create({
      data: {
        userId,
        friendId,
        status: 'pending',
      },
    })

    return NextResponse.json({ friendship, message: 'Demande envoyée !' })
  } catch (error) {
    console.error('Add friend error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Accepter/refuser une demande d'ami
export async function PUT(request: NextRequest) {
  try {
    const { friendshipId, status } = await request.json()

    if (!friendshipId || !status) {
      return NextResponse.json({ error: 'friendshipId et status requis' }, { status: 400 })
    }

    if (status === 'accepted') {
      const friendship = await prisma.friendship.update({
        where: { id: friendshipId },
        data: { status: 'accepted' },
      })
      return NextResponse.json({ friendship, message: 'Ami ajouté !' })
    } else {
      // Refuser = supprimer
      await prisma.friendship.delete({ where: { id: friendshipId } })
      return NextResponse.json({ message: 'Demande refusée' })
    }
  } catch (error) {
    console.error('Update friendship error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer un ami
export async function DELETE(request: NextRequest) {
  try {
    const { userId, friendId } = await request.json()

    if (!userId || !friendId) {
      return NextResponse.json({ error: 'userId et friendId requis' }, { status: 400 })
    }

    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    })

    return NextResponse.json({ message: 'Ami supprimé' })
  } catch (error) {
    console.error('Delete friend error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
