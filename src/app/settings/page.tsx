'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'

interface Habit {
  id: string
  name: string
  frequency: string
  targetCount: number | null
  order: number
  isActive: boolean
}

interface Category {
  id: string
  name: string
  icon: string
  type: string
  order: number
  habits: Habit[]
}

// Templates de catégories par type
const CATEGORY_TEMPLATES = {
  quotidien: [
    { name: 'MATIN', icon: '☀️', type: 'quotidien' },
    { name: 'JOURNÉE', icon: '🔵', type: 'quotidien' },
    { name: 'SOIR', icon: '🌙', type: 'quotidien' },
  ],
  hebdo: [
    { name: 'HEBDO', icon: '📅', type: 'hebdo' },
  ],
  addiction: [
    { name: 'ADDICTION', icon: '🚫', type: 'addiction' },
  ],
}

const TYPE_LABELS = {
  quotidien: { label: 'Quotidien', description: 'Habitudes du matin, journée, soir', icon: '📆' },
  hebdo: { label: 'Hebdomadaire', description: 'Habitudes à faire X fois par semaine', icon: '📅' },
  addiction: { label: 'Addiction', description: 'Choses à éviter/ne pas faire', icon: '🚫' },
}

const EMOJI_LIST = [
  // Temps / Périodes
  '☀️', '🌙', '🔵', '📅', '📆', '⏰', '🌅', '🌇',
  // Sport / Santé
  '💪', '🏃', '🧘', '🏋️', '🚴', '🏊', '⚽', '🎾', '🥗', '🍎', '💧', '🩺', '💊', '🦷',
  // Productivité
  '📚', '📝', '✅', '🎯', '💡', '📊', '💻', '🖥️', '📧', '📞',
  // Bien-être
  '😴', '🧠', '❤️', '🙏', '🌳', '🌿', '🍃',
  // Créativité
  '🎨', '🎵', '📸', '✏️', '🎬', '🎸',
  // Social
  '👥', '🤝', '💬', '👨‍👩‍👧‍👦', '❤️',
  // Divers
  '⭐', '🔥', '✨', '🎉', '🏠', '🛒', '💰', '🎁',
  // Addiction
  '🚫', '🎮', '📱', '🍺', '🚬', '☕', '🍬', '🍟', '📺',
]

// Templates d'habitudes par nom de catégorie
const HABIT_TEMPLATES: { [key: string]: string[] } = {
  // Catégories MATIN
  'matin': [
    '🛏️ Faire son lit',
    '🧘 Méditation / Étirements',
    '💧 Boire un verre d\'eau',
    '🍳 Petit-déjeuner sain',
    '📖 Lecture 10 min',
    '📝 Journaling',
    '🚿 Douche froide',
    '☀️ Exposition lumière naturelle',
    '📵 Pas de téléphone 30 min',
    '🎯 Définir les 3 priorités du jour',
  ],
  // Catégories JOURNÉE
  'journée': [
    '💧 Boire 2L d\'eau',
    '🚶 10 000 pas',
    '🥗 Repas équilibré',
    '⏰ Pomodoro (4 sessions)',
    '🧘 Pause respiration',
    '📵 Digital detox 1h',
    '☀️ Sortir prendre l\'air',
    '✅ Tâche importante complétée',
    '📚 Apprendre quelque chose',
    '🤝 Interaction sociale positive',
  ],
  // Catégories SOIR
  'soir': [
    '📵 Pas d\'écran 1h avant dodo',
    '📖 Lecture 20 min',
    '🧘 Méditation / Relaxation',
    '📝 Gratitude (3 choses)',
    '🎯 Bilan de la journée',
    '👕 Préparer affaires du lendemain',
    '🦷 Routine dentaire',
    '🛏️ Couché avant 23h',
    '🌙 8h de sommeil',
    '📋 To-do list du lendemain',
  ],
  // Catégories HEBDO
  'hebdo': [
    '🏋️ Sport (3x/semaine)',
    '🧹 Ménage',
    '🛒 Courses',
    '📞 Appeler famille/amis',
    '📊 Review hebdo',
    '🎨 Hobby créatif',
    '🌳 Sortie nature',
    '📚 Finir un chapitre/article',
    '💰 Check finances',
    '🧺 Lessive',
  ],
  // Catégories ADDICTION
  'addiction': [
    '🚬 Pas de cigarette',
    '🍺 Pas d\'alcool',
    '🍬 Pas de sucre ajouté',
    '📱 Pas de réseaux sociaux',
    '🎮 Pas de jeux vidéo',
    '☕ Max 2 cafés',
    '🍟 Pas de fast-food',
    '📺 Pas de Netflix/streaming',
    '🛒 Pas d\'achats impulsifs',
    '😤 Pas de procrastination',
  ],
}

// Fonction pour trouver les templates selon le nom de la catégorie
const getHabitSuggestions = (categoryName: string, categoryType: string): string[] => {
  const nameLower = categoryName.toLowerCase()
  
  // Chercher par nom de catégorie
  if (nameLower.includes('matin')) return HABIT_TEMPLATES['matin']
  if (nameLower.includes('journée') || nameLower.includes('journee')) return HABIT_TEMPLATES['journée']
  if (nameLower.includes('soir')) return HABIT_TEMPLATES['soir']
  if (nameLower.includes('hebdo')) return HABIT_TEMPLATES['hebdo']
  if (nameLower.includes('addiction')) return HABIT_TEMPLATES['addiction']
  
  // Sinon par type de catégorie
  if (categoryType === 'hebdo') return HABIT_TEMPLATES['hebdo']
  if (categoryType === 'addiction') return HABIT_TEMPLATES['addiction']
  
  // Par défaut retourner les habitudes de journée
  return HABIT_TEMPLATES['journée']
}

export default function SettingsPage() {
  const { user: authUser, isLoading: authLoading, updateUser, logout } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // États pour les formulaires
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryIcon, setNewCategoryIcon] = useState('📋')
  const [newCategoryType, setNewCategoryType] = useState('quotidien')
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editCategoryName, setEditCategoryName] = useState('')
  const [editCategoryIcon, setEditCategoryIcon] = useState('')
  const [editCategoryType, setEditCategoryType] = useState('quotidien')
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null) // Pour catégories et habitudes

  // États pour les habitudes
  const [newHabitName, setNewHabitName] = useState<{ [key: string]: string }>({})
  const [showSuggestions, setShowSuggestions] = useState<{ [key: string]: boolean }>({})

  // États pour le profil
  const [editPseudo, setEditPseudo] = useState('')
  const [editAvatar, setEditAvatar] = useState('')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // États pour les jokers
  const [jokerCount, setJokerCount] = useState(0)
  const [jokerPeriod, setJokerPeriod] = useState<'week' | 'month' | 'year'>('week')

  const [activeTab, setActiveTab] = useState<'habits' | 'profile' | 'jokers'>('habits')

  useEffect(() => {
    if (authUser && !authLoading) {
      setEditPseudo(authUser.pseudo)
      setEditAvatar(authUser.avatar)
      fetchData(authUser.id)
    }
  }, [authUser, authLoading])

  const fetchData = async (userId: string) => {
    try {
      // Récupérer les catégories
      const catRes = await fetch(`/api/categories?userId=${userId}`)
      const catData = await catRes.json()
      if (catRes.ok) {
        setCategories(catData.categories)
      }

      // Récupérer les paramètres utilisateur (jokers)
      const userRes = await fetch(`/api/user/settings?userId=${userId}`)
      const userData = await userRes.json()
      if (userRes.ok && userData.user) {
        setJokerCount(userData.user.jokerCount || 0)
        setJokerPeriod(userData.user.jokerPeriod || 'week')
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  // === CATÉGORIES ===
  const createFromTemplates = async () => {
    if (!authUser || selectedTemplates.length === 0) return
    setSaving(true)

    try {
      // Collecter toutes les catégories à créer
      const categoriesToCreate: { name: string; icon: string; type: string }[] = []
      
      selectedTemplates.forEach(templateType => {
        const templates = CATEGORY_TEMPLATES[templateType as keyof typeof CATEGORY_TEMPLATES]
        if (templates) {
          categoriesToCreate.push(...templates)
        }
      })

      console.log('Creating categories:', categoriesToCreate)
      
      let createdCount = 0
      for (const cat of categoriesToCreate) {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: authUser.id, name: cat.name, icon: cat.icon, type: cat.type }),
        })
        
        if (res.ok) {
          createdCount++
        } else {
          const errorData = await res.json()
          console.error('Failed to create category:', cat.name, errorData)
        }
      }
      
      console.log('Created', createdCount, 'categories')
      
      // Recharger les données
      await fetchData(authUser.id)
      
      setShowTemplateModal(false)
      setSelectedTemplates([])
      
      if (createdCount > 0) {
        showMessage('success', `${createdCount} catégorie(s) créée(s) !`)
      } else {
        showMessage('error', 'Aucune catégorie créée')
      }
    } catch (error) {
      console.error('Error creating templates:', error)
      showMessage('error', 'Erreur lors de la création')
    } finally {
      setSaving(false)
    }
  }

  const toggleTemplate = (templateType: string) => {
    setSelectedTemplates(prev => 
      prev.includes(templateType) 
        ? prev.filter(t => t !== templateType)
        : [...prev, templateType]
    )
  }

  const addCategory = async () => {
    if (!authUser || !newCategoryName.trim()) return
    setSaving(true)

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: authUser.id, 
          name: newCategoryName.trim(), 
          icon: newCategoryIcon,
          type: newCategoryType 
        }),
      })

      if (res.ok) {
        setNewCategoryName('')
        setNewCategoryIcon('📋')
        setNewCategoryType('quotidien')
        await fetchData(authUser.id)
        showMessage('success', 'Catégorie ajoutée !')
      }
    } catch {
      showMessage('error', 'Erreur lors de l\'ajout')
    } finally {
      setSaving(false)
    }
  }

  const updateCategory = async (id: string) => {
    if (!editCategoryName.trim()) return
    setSaving(true)

    try {
      const res = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          name: editCategoryName.trim(), 
          icon: editCategoryIcon,
          type: editCategoryType,
        }),
      })

      if (res.ok) {
        setEditingCategory(null)
        setShowEmojiPicker(null)
        if (authUser) await fetchData(authUser.id)
        showMessage('success', 'Catégorie mise à jour !')
      }
    } catch {
      showMessage('error', 'Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Supprimer cette catégorie et toutes ses habitudes ?')) return
    setSaving(true)

    try {
      const res = await fetch('/api/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (res.ok) {
        if (authUser) await fetchData(authUser.id)
        showMessage('success', 'Catégorie supprimée !')
      }
    } catch {
      showMessage('error', 'Erreur lors de la suppression')
    } finally {
      setSaving(false)
    }
  }

  // === HABITUDES ===
  const addHabit = async (categoryId: string) => {
    if (!authUser || !newHabitName[categoryId]?.trim()) return
    setSaving(true)

    // Déterminer la fréquence selon le type de catégorie
    const category = categories.find(c => c.id === categoryId)
    const frequency = category?.type === 'hebdo' ? 'weekly' : 'daily'

    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authUser.id,
          categoryId,
          name: newHabitName[categoryId].trim(),
          frequency,
        }),
      })

      if (res.ok) {
        setNewHabitName(prev => ({ ...prev, [categoryId]: '' }))
        await fetchData(authUser.id)
        showMessage('success', 'Habitude ajoutée !')
      }
    } catch {
      showMessage('error', 'Erreur lors de l\'ajout')
    } finally {
      setSaving(false)
    }
  }

  const deleteHabit = async (id: string) => {
    if (!confirm('Supprimer cette habitude ?')) return
    setSaving(true)

    try {
      const res = await fetch('/api/habits', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (res.ok) {
        if (authUser) await fetchData(authUser.id)
        showMessage('success', 'Habitude supprimée !')
      }
    } catch {
      showMessage('error', 'Erreur lors de la suppression')
    } finally {
      setSaving(false)
    }
  }

  // === JOKERS ===
  const saveJokerSettings = async () => {
    if (!authUser) return
    setSaving(true)

    try {
      const res = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authUser.id,
          jokerCount,
          jokerPeriod,
        }),
      })

      if (res.ok) {
        showMessage('success', 'Paramètres des jokers sauvegardés !')
      } else {
        const data = await res.json()
        showMessage('error', data.error || 'Erreur')
      }
    } catch {
      showMessage('error', 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  // === PROFIL ===
  const updateProfile = async () => {
    if (!authUser) return
    setSaving(true)

    try {
      const res = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authUser.id,
          pseudo: editPseudo.trim(),
          avatar: editAvatar,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        // Mettre à jour le contexte d'authentification
        updateUser({
          pseudo: data.user.pseudo,
          avatar: data.user.avatar,
        })
        showMessage('success', 'Profil mis à jour !')
      } else {
        showMessage('error', data.error || 'Erreur')
      }
    } catch {
      showMessage('error', 'Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  const updatePassword = async () => {
    if (!authUser) return
    if (newPassword !== confirmPassword) {
      showMessage('error', 'Les mots de passe ne correspondent pas')
      return
    }
    if (newPassword.length < 6) {
      showMessage('error', 'Le mot de passe doit faire au moins 6 caractères')
      return
    }

    setSaving(true)

    try {
      const res = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authUser.id,
          oldPassword,
          newPassword,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setOldPassword('')
        setNewPassword('')
        setConfirmPassword('')
        showMessage('success', 'Mot de passe mis à jour !')
      } else {
        showMessage('error', data.error || 'Erreur')
      }
    } catch {
      showMessage('error', 'Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }


  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-pulse">⚙️</div>
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
          <h1 className="text-2xl font-bold text-white">⚙️ Paramètres</h1>
          <button onClick={logout} className="btn btn-secondary">
            Déconnexion
          </button>
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
            { id: 'habits', label: '📝 Habitudes' },
            { id: 'jokers', label: '🃏 Jokers' },
            { id: 'profile', label: '👤 Profil' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id 
                  ? 'bg-primary-500 text-white' 
                  : 'text-dark-400 hover:text-white hover:bg-dark-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Habitudes */}
        {activeTab === 'habits' && (
          <div className="space-y-6">
            {/* Bouton catégories par défaut */}
            {categories.length === 0 && (
              <div className="card text-center py-8">
                <div className="text-4xl mb-4">✨</div>
                <h2 className="text-lg font-semibold text-white mb-2">
                  Commence par créer tes catégories
                </h2>
                <p className="text-dark-400 mb-4">
                  Tu peux utiliser les catégories par défaut ou créer les tiennes.
                </p>
                <button onClick={() => setShowTemplateModal(true)} className="btn btn-primary">
                  ✨ Choisir un template
                </button>
              </div>
            )}

            {/* Modal de sélection de templates */}
            {showTemplateModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="card max-w-lg w-full animate-scale-in">
                  <h3 className="text-xl font-semibold text-white mb-4">✨ Choisir les catégories</h3>
                  <p className="text-dark-400 text-sm mb-6">Sélectionne les types de catégories que tu veux utiliser :</p>
                  
                  <div className="space-y-3 mb-6">
                    {Object.entries(TYPE_LABELS).map(([type, info]) => (
                      <label 
                        key={type}
                        className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedTemplates.includes(type)
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-dark-700 hover:border-dark-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedTemplates.includes(type)}
                          onChange={() => toggleTemplate(type)}
                          className="w-5 h-5 rounded border-dark-600 bg-dark-900 text-primary-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{info.icon}</span>
                            <span className="text-white font-medium">{info.label}</span>
                          </div>
                          <p className="text-dark-400 text-sm">{info.description}</p>
                          <div className="flex gap-2 mt-2">
                            {CATEGORY_TEMPLATES[type as keyof typeof CATEGORY_TEMPLATES].map(cat => (
                              <span key={cat.name} className="text-xs bg-dark-700 px-2 py-1 rounded">
                                {cat.icon} {cat.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => { setShowTemplateModal(false); setSelectedTemplates([]) }} 
                      className="btn btn-ghost flex-1"
                    >
                      Annuler
                    </button>
                    <button 
                      onClick={createFromTemplates} 
                      disabled={saving || selectedTemplates.length === 0}
                      className="btn btn-primary flex-1"
                    >
                      {saving ? 'Création...' : `Créer ${selectedTemplates.length > 0 ? `(${selectedTemplates.length})` : ''}`}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Ajouter catégorie */}
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">➕ Nouvelle catégorie</h3>
              <div className="flex flex-wrap gap-3 items-end">
                <div className="relative">
                  <label className="block text-xs text-dark-400 mb-1">Icône</label>
                  <button
                    onClick={() => setShowEmojiPicker(showEmojiPicker === 'new-cat' ? null : 'new-cat')}
                    className="w-12 h-10 text-2xl bg-dark-800 hover:bg-dark-700 rounded-lg flex items-center justify-center border border-dark-600"
                  >
                    {newCategoryIcon}
                  </button>
                  {showEmojiPicker === 'new-cat' && (
                    <div className="absolute top-full mt-1 left-0 z-50 bg-dark-800 border border-dark-600 rounded-lg p-2 shadow-xl">
                      <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto w-64">
                        {EMOJI_LIST.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => {
                              setNewCategoryIcon(emoji)
                              setShowEmojiPicker(null)
                            }}
                            className="w-7 h-7 text-base hover:bg-dark-700 rounded flex items-center justify-center"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-xs text-dark-400 mb-1">Nom</label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nom de la catégorie..."
                    className="input"
                    onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                  />
                </div>
                <div>
                  <label className="block text-xs text-dark-400 mb-1">Type</label>
                  <select
                    value={newCategoryType}
                    onChange={(e) => setNewCategoryType(e.target.value)}
                    className="input"
                  >
                    <option value="quotidien">📆 Quotidien</option>
                    <option value="hebdo">📅 Hebdo</option>
                    <option value="addiction">🚫 Addiction</option>
                  </select>
                </div>
                <button onClick={addCategory} disabled={saving || !newCategoryName.trim()} className="btn btn-primary">
                  Ajouter
                </button>
              </div>
            </div>

            {/* Liste des catégories */}
            {categories.map((category) => (
              <div key={category.id} className="card">
                {/* Header catégorie */}
                <div className="flex flex-col gap-3 mb-4">
                  {editingCategory === category.id ? (
                    <div className="space-y-3">
                      {/* Ligne 1: Emoji + Nom */}
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <button
                            onClick={() => setShowEmojiPicker(showEmojiPicker === `cat-${category.id}` ? null : `cat-${category.id}`)}
                            className="w-12 h-12 text-2xl bg-dark-800 hover:bg-dark-700 rounded-lg flex items-center justify-center border border-dark-600"
                          >
                            {editCategoryIcon}
                          </button>
                          {showEmojiPicker === `cat-${category.id}` && (
                            <div className="absolute top-14 left-0 z-50 bg-dark-800 border border-dark-600 rounded-lg p-2 shadow-xl">
                              <div className="grid grid-cols-6 gap-1 max-h-40 overflow-y-auto">
                                {EMOJI_LIST.map(emoji => (
                                  <button
                                    key={emoji}
                                    onClick={() => {
                                      setEditCategoryIcon(emoji)
                                      setShowEmojiPicker(null)
                                    }}
                                    className="w-8 h-8 text-lg hover:bg-dark-700 rounded flex items-center justify-center"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <input
                          type="text"
                          value={editCategoryName}
                          onChange={(e) => setEditCategoryName(e.target.value)}
                          className="input flex-1"
                          placeholder="Nom de la catégorie"
                        />
                      </div>
                      
                      {/* Ligne 2: Type */}
                      <div className="flex gap-2">
                        {[
                          { value: 'quotidien', label: '📆 Quotidien', color: 'blue' },
                          { value: 'hebdo', label: '📅 Hebdo', color: 'purple' },
                          { value: 'addiction', label: '🚫 Addiction', color: 'red' },
                        ].map(type => (
                          <button
                            key={type.value}
                            onClick={() => setEditCategoryType(type.value)}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                              editCategoryType === type.value
                                ? type.color === 'blue' ? 'bg-blue-500 text-white ring-2 ring-blue-400' :
                                  type.color === 'purple' ? 'bg-purple-500 text-white ring-2 ring-purple-400' :
                                  'bg-red-500 text-white ring-2 ring-red-400'
                                : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                            }`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>

                      {/* Ligne 3: Boutons */}
                      <div className="flex gap-2">
                        <button onClick={() => updateCategory(category.id)} className="btn btn-primary">
                          ✓ Sauvegarder
                        </button>
                        <button onClick={() => { setEditingCategory(null); setShowEmojiPicker(null) }} className="btn btn-ghost">
                          ✕ Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-white">
                          <span className="mr-2">{category.icon}</span>
                          {category.name}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          category.type === 'quotidien' ? 'bg-blue-500/20 text-blue-400' :
                          category.type === 'hebdo' ? 'bg-purple-500/20 text-purple-400' :
                          category.type === 'addiction' ? 'bg-red-500/20 text-red-400' :
                          'bg-dark-700 text-dark-400'
                        }`}>
                          {category.type === 'quotidien' ? '📆 Quotidien' :
                           category.type === 'hebdo' ? '📅 Hebdo' :
                           category.type === 'addiction' ? '🚫 Addiction' : category.type}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setEditingCategory(category.id)
                            setEditCategoryName(category.name)
                            setEditCategoryIcon(category.icon)
                            setEditCategoryType(category.type)
                          }}
                          className="btn btn-ghost btn-sm"
                        >
                          ✏️
                        </button>
                        <button onClick={() => deleteCategory(category.id)} className="btn btn-ghost btn-sm text-red-400">
                          🗑️
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Liste des habitudes */}
                <div className="space-y-2 mb-4">
                  {category.habits.map((habit) => (
                    <div key={habit.id} className="flex items-center justify-between p-3 bg-dark-900 rounded-lg">
                      <div>
                        <span className="text-white">{habit.name}</span>
                        {habit.targetCount && (
                          <span className="text-dark-500 text-sm ml-2">({habit.targetCount})</span>
                        )}
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                          habit.frequency === 'weekly' 
                            ? 'bg-blue-500/20 text-blue-400' 
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {habit.frequency === 'weekly' ? 'Hebdo' : 'Quotidien'}
                        </span>
                      </div>
                      <button onClick={() => deleteHabit(habit.id)} className="text-red-400 hover:text-red-300">
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>

                {/* Ajouter habitude */}
                <div className="pt-3 border-t border-dark-700 space-y-2">
                  {/* Bouton suggestions */}
                  <button
                    onClick={() => setShowSuggestions(prev => ({ ...prev, [category.id]: !prev[category.id] }))}
                    className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
                  >
                    💡 {showSuggestions[category.id] ? 'Masquer suggestions' : 'Voir les suggestions'}
                  </button>

                  {/* Liste des suggestions */}
                  {showSuggestions[category.id] && (
                    <div className="bg-dark-900 rounded-lg p-3 space-y-2 max-h-64 overflow-y-auto">
                      <p className="text-xs text-dark-400">Cliquez pour sélectionner :</p>
                      <div className="flex flex-wrap gap-1.5">
                        {getHabitSuggestions(category.name, category.type)
                          .filter(suggestion => {
                            const habitName = suggestion.replace(/^[^\s]+\s/, '').toLowerCase()
                            return !category.habits.some(h => h.name.toLowerCase().includes(habitName.slice(0, 10)))
                          })
                          .map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setNewHabitName(prev => ({ ...prev, [category.id]: suggestion }))
                                setShowSuggestions(prev => ({ ...prev, [category.id]: false }))
                              }}
                              className="text-sm bg-dark-800 hover:bg-primary-500/20 hover:text-primary-300 text-dark-200 px-3 py-1.5 rounded-lg transition-colors border border-dark-700 hover:border-primary-500/30"
                            >
                              {suggestion}
                            </button>
                          ))}
                      </div>
                      {getHabitSuggestions(category.name, category.type)
                        .filter(suggestion => {
                          const habitName = suggestion.replace(/^[^\s]+\s/, '').toLowerCase()
                          return !category.habits.some(h => h.name.toLowerCase().includes(habitName.slice(0, 10)))
                        }).length === 0 && (
                        <p className="text-xs text-dark-500 italic">Toutes les suggestions ont été ajoutées ! 🎉</p>
                      )}
                    </div>
                  )}

                  {/* Input manuel */}
                  <div className="flex gap-2 relative">
                    {/* Bouton emoji */}
                    <div className="relative">
                      <button
                        onClick={() => setShowEmojiPicker(showEmojiPicker === `habit-${category.id}` ? null : `habit-${category.id}`)}
                        className="w-10 h-10 text-lg bg-dark-800 hover:bg-dark-700 rounded-lg flex items-center justify-center border border-dark-600"
                        title="Ajouter un emoji"
                      >
                        😀
                      </button>
                      {showEmojiPicker === `habit-${category.id}` && (
                        <div className="absolute bottom-12 left-0 z-50 bg-dark-800 border border-dark-600 rounded-lg p-2 shadow-xl">
                          <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto w-64">
                            {EMOJI_LIST.map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => {
                                  setNewHabitName(prev => ({ 
                                    ...prev, 
                                    [category.id]: `${emoji} ${prev[category.id] || ''}`.trim() 
                                  }))
                                  setShowEmojiPicker(null)
                                }}
                                className="w-7 h-7 text-base hover:bg-dark-700 rounded flex items-center justify-center"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <input
                      type="text"
                      value={newHabitName[category.id] || ''}
                      onChange={(e) => setNewHabitName(prev => ({ ...prev, [category.id]: e.target.value }))}
                      placeholder="Nouvelle habitude..."
                      className="input flex-1"
                      onKeyDown={(e) => e.key === 'Enter' && addHabit(category.id)}
                    />
                    <button 
                      onClick={() => addHabit(category.id)} 
                      disabled={saving || !newHabitName[category.id]?.trim()}
                      className="btn btn-primary"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Jokers */}
        {activeTab === 'jokers' && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">🃏 Configuration des Jokers</h3>
              <p className="text-dark-400 text-sm mb-6">
                Les jokers te permettent de valider une habitude sans l&apos;avoir vraiment faite. 
                Utilise-les pour les jours exceptionnels (maladie, vacances, etc.).
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-dark-400 mb-2">Nombre de jokers par période</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={jokerCount}
                    onChange={(e) => setJokerCount(parseInt(e.target.value) || 0)}
                    className="input w-24"
                  />
                </div>

                <div>
                  <label className="block text-sm text-dark-400 mb-2">Période de renouvellement</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'week', label: '📅 Semaine' },
                      { value: 'month', label: '📆 Mois' },
                      { value: 'year', label: '🗓️ Année' },
                    ].map(period => (
                      <button
                        key={period.value}
                        onClick={() => setJokerPeriod(period.value as typeof jokerPeriod)}
                        className={`px-4 py-2.5 rounded-lg transition-all font-medium ${
                          jokerPeriod === period.value
                            ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30 ring-2 ring-purple-400'
                            : 'bg-dark-800 text-dark-400 hover:bg-dark-700 hover:text-dark-200'
                        }`}
                      >
                        {period.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-dark-700">
                  <h4 className="text-sm font-medium text-white mb-2">Comment utiliser les jokers ?</h4>
                  <ul className="text-sm text-dark-400 space-y-1">
                    <li>• <strong>Sur PC :</strong> Clic droit sur une case, ou activer le mode joker</li>
                    <li>• <strong>Sur mobile :</strong> Activer le &quot;Mode Joker&quot; puis cliquer sur une case</li>
                    <li>• Le bouton mode joker se trouve sous les stats de jokers sur le tableau de bord</li>
                    <li>• Les cases avec joker apparaissent en 🃏 violet</li>
                    <li>• Les jokers <strong>excluent</strong> le jour des stats (ex: 363/363 au lieu de 365)</li>
                  </ul>
                </div>

                <button
                  onClick={saveJokerSettings}
                  disabled={saving}
                  className="btn btn-primary mt-4"
                >
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Profil */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">👤 Informations</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Avatar</label>
                  <input
                    type="text"
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    className="input w-20 text-center text-2xl"
                    maxLength={2}
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Pseudo</label>
                  <input
                    type="text"
                    value={editPseudo}
                    onChange={(e) => setEditPseudo(e.target.value)}
                    className="input"
                  />
                </div>
                <button onClick={updateProfile} disabled={saving} className="btn btn-primary">
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">🔑 Changer le mot de passe</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Ancien mot de passe</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Nouveau mot de passe</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Confirmer le mot de passe</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input"
                  />
                </div>
                <button onClick={updatePassword} disabled={saving} className="btn btn-primary">
                  {saving ? 'Changement...' : 'Changer le mot de passe'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

