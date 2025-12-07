'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'

interface User {
  id: string
  pseudo: string
  avatar: string
  relationStatus?: string | null
  isRequester?: boolean
}

interface PendingRequest {
  id: string
  user: User
}

export default function FriendsPage() {
  const { user: authUser, isLoading: authLoading } = useAuth()
  const [friends, setFriends] = useState<User[]>([])
  const [pending, setPending] = useState<PendingRequest[]>([])
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [isFirstLoad, setIsFirstLoad] = useState(true)
  const [activeTab, setActiveTab] = useState<'friends' | 'pending' | 'search'>('friends')
  const [message, setMessage] = useState({ type: '', text: '' })

  const fetchData = useCallback(async (showLoading = false) => {
    if (!authUser) return
    if (showLoading || isFirstLoad) setLoading(true)

    try {
      // Récupérer les amis
      const friendsRes = await fetch(`/api/friends?userId=${authUser.id}&type=friends`)
      const friendsData = await friendsRes.json()
      if (friendsRes.ok) setFriends(friendsData.friends || [])

      // Récupérer les demandes en attente
      const pendingRes = await fetch(`/api/friends?userId=${authUser.id}&type=pending`)
      const pendingData = await pendingRes.json()
      if (pendingRes.ok) setPending(pendingData.pending || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
      setIsFirstLoad(false)
    }
  }, [authUser, isFirstLoad])

  useEffect(() => {
    if (authUser && !authLoading) {
      fetchData(true) // Premier chargement avec loading
      
      // Polling toutes les 10 secondes pour les mises à jour en temps réel
      const interval = setInterval(() => {
        fetchData(false) // Polling silencieux sans loading
      }, 10000)
      
      return () => clearInterval(interval)
    }
  }, [authUser, authLoading, fetchData])

  const handleSearch = async () => {
    if (!authUser || !searchQuery.trim()) return
    setSearching(true)

    try {
      const res = await fetch(`/api/friends?userId=${authUser.id}&type=search&search=${encodeURIComponent(searchQuery.trim())}`)
      const data = await res.json()
      if (res.ok) {
        setSearchResults(data.users || [])
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearching(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const sendFriendRequest = async (friendId: string) => {
    if (!authUser) return

    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: authUser.id, friendId }),
      })

      const data = await res.json()

      if (res.ok) {
        showMessage('success', 'Demande envoyée ! 🎉')
        // Mettre à jour les résultats de recherche
        setSearchResults(prev => prev.map(u => 
          u.id === friendId ? { ...u, relationStatus: 'pending', isRequester: true } : u
        ))
      } else {
        showMessage('error', data.error || 'Erreur')
      }
    } catch {
      showMessage('error', 'Erreur lors de l\'envoi')
    }
  }

  const respondToRequest = async (friendshipId: string, accept: boolean) => {
    try {
      const res = await fetch('/api/friends', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId, status: accept ? 'accepted' : 'rejected' }),
      })

      if (res.ok) {
        showMessage('success', accept ? 'Ami ajouté ! 🎉' : 'Demande refusée')
        await fetchData()
      }
    } catch {
      showMessage('error', 'Erreur')
    }
  }

  const removeFriend = async (friendId: string) => {
    if (!authUser || !confirm('Supprimer cet ami ?')) return

    try {
      const res = await fetch('/api/friends', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: authUser.id, friendId }),
      })

      if (res.ok) {
        showMessage('success', 'Ami supprimé')
        await fetchData()
      }
    } catch {
      showMessage('error', 'Erreur')
    }
  }

  if (authLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-pulse">👥</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="btn btn-ghost">
            ← Retour au tracker
          </Link>
          <h1 className="text-2xl font-bold text-white">👥 Amis</h1>
          <div className="w-24" />
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-dark-700 pb-2">
          {[
            { id: 'friends', label: '👥 Mes amis', count: friends.length },
            { id: 'pending', label: '📩 Demandes', count: pending.length },
            { id: 'search', label: '🔍 Rechercher' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === tab.id 
                  ? 'bg-primary-500 text-white' 
                  : 'text-dark-400 hover:text-white hover:bg-dark-800'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-dark-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab: Mes amis */}
        {activeTab === 'friends' && (
          <div className="space-y-4">
            {friends.length === 0 ? (
              <div className="card text-center py-8">
                <div className="text-4xl mb-4">👋</div>
                <h2 className="text-lg font-semibold text-white mb-2">
                  Pas encore d&apos;amis
                </h2>
                <p className="text-dark-400 mb-4">
                  Recherche des utilisateurs par leur pseudo pour les ajouter !
                </p>
                <button onClick={() => setActiveTab('search')} className="btn btn-primary">
                  🔍 Rechercher des amis
                </button>
              </div>
            ) : (
              friends.map(friend => (
                <div key={friend.id} className="card flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{friend.avatar}</span>
                    <h3 className="font-semibold text-white">{friend.pseudo}</h3>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/tracker/${friend.id}`} className="btn btn-primary btn-sm">
                      📊 Voir tracker
                    </Link>
                    <button onClick={() => removeFriend(friend.id)} className="btn btn-ghost btn-sm text-red-400">
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Demandes en attente */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {pending.length === 0 ? (
              <div className="card text-center py-8">
                <div className="text-4xl mb-4">📭</div>
                <p className="text-dark-400">Aucune demande d&apos;ami en attente</p>
              </div>
            ) : (
              pending.map(request => (
                <div key={request.id} className="card flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{request.user.avatar}</span>
                    <div>
                      <h3 className="font-semibold text-white">{request.user.pseudo}</h3>
                      <p className="text-sm text-dark-400">Veut être ton ami</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => respondToRequest(request.id, true)} 
                      className="btn btn-primary btn-sm"
                    >
                      ✓ Accepter
                    </button>
                    <button 
                      onClick={() => respondToRequest(request.id, false)} 
                      className="btn btn-ghost btn-sm text-red-400"
                    >
                      ✕ Refuser
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Rechercher */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            {/* Barre de recherche */}
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">🔍 Rechercher un utilisateur</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Entre un pseudo..."
                  className="input flex-1"
                  autoFocus
                />
                <button 
                  onClick={handleSearch} 
                  disabled={searching || !searchQuery.trim()}
                  className="btn btn-primary"
                >
                  {searching ? '⏳' : '🔍'} Rechercher
                </button>
              </div>
            </div>

            {/* Résultats */}
            {searchResults.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-sm text-dark-400">
                  {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''}
                </h4>
                {searchResults.map(user => (
                  <div key={user.id} className="card flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{user.avatar}</span>
                      <h3 className="font-semibold text-white">{user.pseudo}</h3>
                    </div>
                    <div>
                      {user.relationStatus === 'accepted' ? (
                        <span className="text-green-400 text-sm flex items-center gap-1">
                          ✓ Déjà amis
                        </span>
                      ) : user.relationStatus === 'pending' ? (
                        <span className="text-yellow-400 text-sm flex items-center gap-1">
                          ⏳ {user.isRequester ? 'Demande envoyée' : 'Demande reçue'}
                        </span>
                      ) : (
                        <button 
                          onClick={() => sendFriendRequest(user.id)} 
                          className="btn btn-primary btn-sm"
                        >
                          ➕ Ajouter
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery && !searching ? (
              <div className="card text-center py-8">
                <div className="text-4xl mb-4">🔍</div>
                <p className="text-dark-400">Aucun utilisateur trouvé pour &quot;{searchQuery}&quot;</p>
              </div>
            ) : null}
          </div>
        )}

        {/* Info */}
        <div className="mt-8 card bg-dark-900">
          <h4 className="text-sm font-semibold text-dark-300 mb-2">ℹ️ Comment ça marche ?</h4>
          <ul className="text-dark-400 text-sm space-y-1">
            <li>• Recherche des utilisateurs par leur pseudo</li>
            <li>• Envoie une demande d&apos;ami</li>
            <li>• Une fois accepté, tu peux voir leur tracker d&apos;habitudes</li>
            <li>• Tes amis peuvent aussi voir ton tracker</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
