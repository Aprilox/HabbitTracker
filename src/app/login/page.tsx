'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [pseudo, setPseudo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pseudo.trim()) {
      setError('Entre ton pseudo')
      return
    }
    if (!password) {
      setError('Entre ton mot de passe')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pseudo: pseudo.trim(), password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur de connexion')
        return
      }

      // Utiliser le contexte pour la connexion
      login({
        id: data.user.id,
        pseudo: data.user.pseudo,
        avatar: data.user.avatar || '👤',
      })
    } catch {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 via-dark-900 to-dark-950" />
      
      <div className="relative w-full max-w-md">
        <div className="card animate-scale-in">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🔐</div>
            <h1 className="text-2xl font-bold text-white">Connexion</h1>
            <p className="text-dark-400 mt-2">Entre tes identifiants</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="pseudo" className="block text-sm font-medium text-dark-300 mb-2">
                Pseudo
              </label>
              <input
                type="text"
                id="pseudo"
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                placeholder="Ton pseudo..."
                className="input"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-dark-300 mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Connexion...
                </>
              ) : (
                <>
                  <span>🚀</span>
                  Se connecter
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-dark-400 text-sm">
              Pas encore de compte ?{' '}
              <Link href="/register" className="text-primary-400 hover:text-primary-300 font-medium">
                Créer un compte
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
