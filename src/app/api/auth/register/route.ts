import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { pseudo, password } = await request.json()

    if (!pseudo?.trim()) {
      return NextResponse.json({ error: 'Le pseudo est requis' }, { status: 400 })
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Le mot de passe doit faire au moins 6 caractères' }, { status: 400 })
    }

    // Vérifier si le pseudo existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { pseudo: pseudo.trim() },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Ce pseudo est déjà pris' }, { status: 409 })
    }

    // Hasher le mot de passe avec bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(password, 10)

    // Créer l'utilisateur avec mot de passe hashé
    const user = await prisma.user.create({
      data: {
        pseudo: pseudo.trim(),
        password: hashedPassword,
      },
    })

    return NextResponse.json({
      user: {
        id: user.id,
        pseudo: user.pseudo,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
      message: 'Compte créé avec succès !',
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}



