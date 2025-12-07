import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - Récupérer les habitudes d'un utilisateur
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const categoryId = searchParams.get('categoryId')

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 })
    }

    const where: any = { userId, isActive: true }
    if (categoryId) where.categoryId = categoryId

    const habits = await prisma.habit.findMany({
      where,
      orderBy: { order: 'asc' },
      include: { category: true },
    })

    return NextResponse.json({ habits })
  } catch (error) {
    console.error('Get habits error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer une nouvelle habitude
export async function POST(request: NextRequest) {
  try {
    const { userId, categoryId, name, frequency, targetCount } = await request.json()

    if (!userId || !categoryId || !name) {
      return NextResponse.json({ error: 'userId, categoryId et name requis' }, { status: 400 })
    }

    // Compter les habitudes existantes dans cette catégorie pour l'ordre
    const existingCount = await prisma.habit.count({ where: { categoryId } })

    const habit = await prisma.habit.create({
      data: {
        name: name.trim(),
        frequency: frequency || 'daily',
        targetCount: targetCount || null,
        order: existingCount,
        userId,
        categoryId,
      },
    })

    return NextResponse.json({ habit })
  } catch (error) {
    console.error('Create habit error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Modifier une habitude
export async function PUT(request: NextRequest) {
  try {
    const { id, name, frequency, targetCount, order, isActive, categoryId } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'id requis' }, { status: 400 })
    }

    const habit = await prisma.habit.update({
      where: { id },
      data: {
        name: name?.trim(),
        frequency,
        targetCount,
        order,
        isActive,
        categoryId,
      },
    })

    return NextResponse.json({ habit })
  } catch (error) {
    console.error('Update habit error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer une habitude (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'id requis' }, { status: 400 })
    }

    // Soft delete - marquer comme inactive
    await prisma.habit.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ message: 'Habitude supprimée' })
  } catch (error) {
    console.error('Delete habit error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

