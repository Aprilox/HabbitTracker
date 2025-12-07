'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '../context/AuthContext'

export default function Header() {
  const pathname = usePathname()
  const { user, isLoading, logout } = useAuth()
  const [pendingRequests, setPendingRequests] = useState(0)

  // Fetch pending friend requests every 10 seconds
  useEffect(() => {
    if (!user) {
      setPendingRequests(0)
      return
    }

    const fetchPendingRequests = async () => {
      try {
        const res = await fetch(`/api/friends?userId=${user.id}`)
        if (res.ok) {
          const data = await res.json()
          // Compter les demandes reçues en attente
          const pending = data.receivedRequests?.filter(
            (r: { status: string }) => r.status === 'pending'
          ).length || 0
          setPendingRequests(pending)
        }
      } catch {
        // Silently fail
      }
    }

    // Fetch immédiatement
    fetchPendingRequests()

    // Puis toutes les 10 secondes
    const interval = setInterval(fetchPendingRequests, 10000)

    return () => clearInterval(interval)
  }, [user])

  // Ne pas afficher sur les pages login/register
  if (pathname === '/login' || pathname === '/register') {
    return null
  }

  // Afficher un loader pendant le chargement de la session
  if (isLoading) {
    return (
      <header className="sticky top-0 z-50 bg-dark-950/80 backdrop-blur-sm border-b border-dark-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <span className="text-2xl">📊</span>
            <span className="hidden sm:inline">HabitTracker</span>
          </div>
          <div className="animate-pulse bg-dark-700 h-8 w-32 rounded-lg"></div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 bg-dark-950/80 backdrop-blur-sm border-b border-dark-800">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-white font-bold text-lg">
          <span className="text-2xl">📊</span>
          <span className="hidden sm:inline">HabitTracker</span>
        </Link>

        {user ? (
          <div className="flex items-center gap-2 sm:gap-4">
            <Link 
              href="/friends" 
              className={`btn btn-ghost text-sm relative ${pathname === '/friends' ? 'text-primary-400' : ''}`}
            >
              👥 <span className="hidden sm:inline">Amis</span>
              {pendingRequests > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {pendingRequests > 9 ? '9+' : pendingRequests}
                </span>
              )}
            </Link>
            <Link 
              href="/settings" 
              className={`btn btn-ghost text-sm ${pathname === '/settings' ? 'text-primary-400' : ''}`}
            >
              ⚙️ <span className="hidden sm:inline">Paramètres</span>
            </Link>
            <div className="flex items-center gap-2 pl-2 border-l border-dark-700">
              <span className="text-xl">{user.avatar}</span>
              <span className="text-white font-medium hidden sm:inline">{user.pseudo}</span>
            </div>
            <button onClick={logout} className="btn btn-secondary btn-sm">
              <span className="hidden sm:inline">Déconnexion</span>
              <span className="sm:hidden">👋</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn btn-ghost text-sm">
              Connexion
            </Link>
            <Link href="/register" className="btn btn-primary text-sm">
              Inscription
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
