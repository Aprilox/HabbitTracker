import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET - Récupérer les paramètres utilisateur
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        pseudo: true,
        avatar: true,
        createdAt: true,
        jokerCount: true,
        jokerPeriod: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Get user settings error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Mettre à jour les paramètres utilisateur
export async function PUT(request: NextRequest) {
  try {
    const { userId, pseudo, avatar, oldPassword, newPassword, jokerCount, jokerPeriod } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Vérification du mot de passe si changement
    if (newPassword) {
      if (!oldPassword) {
        return NextResponse.json({ error: 'Ancien mot de passe requis' }, { status: 400 })
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'Le nouveau mot de passe doit faire au moins 6 caractères' }, { status: 400 })
      }
      const isValidOldPassword = await bcrypt.compare(oldPassword, user.password)
      if (!isValidOldPassword) {
        return NextResponse.json({ error: 'Ancien mot de passe incorrect' }, { status: 401 })
      }
    }

    // Vérifier unicité du pseudo si changé
    if (pseudo && pseudo !== user.pseudo) {
      const existingUser = await prisma.user.findUnique({ where: { pseudo: pseudo.trim() } })
      if (existingUser) {
        return NextResponse.json({ error: 'Ce pseudo est déjà utilisé' }, { status: 409 })
      }
    }

    // Hasher le nouveau mot de passe si fourni
    const hashedNewPassword = newPassword ? await bcrypt.hash(newPassword, 10) : undefined

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        pseudo: pseudo?.trim(),
        avatar,
        password: hashedNewPassword,
        jokerCount: jokerCount !== undefined ? jokerCount : undefined,
        jokerPeriod: jokerPeriod || undefined,
      },
      select: {
        id: true,
        pseudo: true,
        avatar: true,
        jokerCount: true,
        jokerPeriod: true,
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Update user settings error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
