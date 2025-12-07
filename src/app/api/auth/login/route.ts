import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { pseudo, password } = await request.json()

    if (!pseudo || typeof pseudo !== 'string') {
      return NextResponse.json(
        { error: 'Pseudo requis' },
        { status: 400 }
      )
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Mot de passe requis' },
        { status: 400 }
      )
    }

    const cleanPseudo = pseudo.trim()

    // Chercher l'utilisateur
    const user = await prisma.user.findUnique({
      where: { pseudo: cleanPseudo },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Pseudo ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Vérifier le mot de passe avec bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Pseudo ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        pseudo: user.pseudo,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
