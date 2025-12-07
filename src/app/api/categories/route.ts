import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - Récupérer les catégories d'un utilisateur
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 })
    }

    const categories = await prisma.category.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
      include: {
        habits: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Get categories error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer une nouvelle catégorie
export async function POST(request: NextRequest) {
  try {
    const { userId, name, icon, type } = await request.json()

    if (!userId || !name) {
      return NextResponse.json({ error: 'userId et name requis' }, { status: 400 })
    }

    // Compter les catégories existantes pour l'ordre
    const existingCount = await prisma.category.count({ where: { userId } })

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        icon: icon || '📋',
        type: type || 'quotidien',
        order: existingCount,
        userId,
      },
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Create category error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Modifier une catégorie
export async function PUT(request: NextRequest) {
  try {
    const { id, name, icon, order, type } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'id requis' }, { status: 400 })
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: name?.trim(),
        icon,
        order,
        type,
      },
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Update category error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer une catégorie
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'id requis' }, { status: 400 })
    }

    await prisma.category.delete({ where: { id } })

    return NextResponse.json({ message: 'Catégorie supprimée' })
  } catch (error) {
    console.error('Delete category error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

