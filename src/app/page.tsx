'use client'

import { useState, useEffect, Fragment } from 'react'
import Link from 'next/link'
import { useAuth } from './context/AuthContext'

interface Habit {
  id: string
  name: string
  frequency: string
  targetCount: number | null
  order: number
}

interface Category {
  id: string
  name: string
  icon: string
  order: number
  habits: Habit[]
}

interface LogData {
  completed: boolean
  isJoker: boolean
}

interface LogsMap {
  [key: string]: LogData
}

interface JokerStats {
  jokerCount: number
  jokerPeriod: string
  jokersUsed: number
  jokersRemaining: number
}

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [logs, setLogs] = useState<LogsMap>({})
  const [allLogs, setAllLogs] = useState<LogsMap>({}) // Tous les logs pour les stats
  const [loading, setLoading] = useState(true)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()))
  const [statsPeriod, setStatsPeriod] = useState<'week' | 'month' | 'year' | 'all' | 'custom'>('week')
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [customStartDate, setCustomStartDate] = useState<string>(formatDateKey(new Date()))
  const [customEndDate, setCustomEndDate] = useState<string>(formatDateKey(new Date()))
  const [userCreatedYear, setUserCreatedYear] = useState<number>(new Date().getFullYear())
  
  // Jokers
  const [jokerStats, setJokerStats] = useState<JokerStats>({ jokerCount: 0, jokerPeriod: 'week', jokersUsed: 0, jokersRemaining: 0 })
  const [jokerMode, setJokerMode] = useState(false) // Mode joker activé
  
  // Demandes d'amis en attente
  const [pendingRequests, setPendingRequests] = useState(0)
  
  // Première date de log (pour les stats "Tout")
  const [firstLogDate, setFirstLogDate] = useState<Date | null>(null)

  // Calculer les jours de la semaine courante
  const weekDays = getWeekDays(currentWeekStart)

  useEffect(() => {
    if (user && !authLoading) {
      fetchData()
    }
  }, [user, authLoading, currentWeekStart])

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
          const pending = data.receivedRequests?.filter(
            (r: { status: string }) => r.status === 'pending'
          ).length || 0
          setPendingRequests(pending)
        }
      } catch {
        // Silently fail
      }
    }

    fetchPendingRequests()
    const interval = setInterval(fetchPendingRequests, 10000)
    return () => clearInterval(interval)
  }, [user])

  const fetchData = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      // Récupérer les catégories avec habitudes
      const catRes = await fetch(`/api/categories?userId=${user.id}`)
      const catData = await catRes.json()
      
      if (catRes.ok) {
        setCategories(catData.categories)
      }

      // Récupérer les logs de la semaine
      const startDate = currentWeekStart.toISOString().split('T')[0]
      const endDate = new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      const logsRes = await fetch(`/api/habits/log?userId=${user.id}&startDate=${startDate}&endDate=${endDate}`)
      const logsData = await logsRes.json()
      
      if (logsRes.ok) {
        const logsMap: LogsMap = {}
        logsData.logs.forEach((log: any) => {
          // Parser la date UTC correctement
          const logDate = new Date(log.date)
          const localDate = new Date(logDate.getUTCFullYear(), logDate.getUTCMonth(), logDate.getUTCDate())
          const dateStr = formatDateKey(localDate)
          logsMap[`${log.habitId}_${dateStr}`] = { completed: log.completed, isJoker: log.isJoker || false }
        })
        setLogs(logsMap)
      }

      // Récupérer TOUS les logs pour les stats (depuis très longtemps pour couvrir tout)
      const veryOldDate = '2020-01-01' // Date de début large
      const today = new Date().toISOString().split('T')[0]
      
      const allLogsRes = await fetch(`/api/habits/log?userId=${user.id}&startDate=${veryOldDate}&endDate=${today}`)
      const allLogsData = await allLogsRes.json()
      
      if (allLogsRes.ok) {
        const allLogsMap: LogsMap = {}
        let minDate: Date | null = null
        
        allLogsData.logs.forEach((log: any) => {
          // Parser la date UTC correctement
          const logDate = new Date(log.date)
          // Créer une date locale à partir de l'UTC pour le formatage
          const localDate = new Date(logDate.getUTCFullYear(), logDate.getUTCMonth(), logDate.getUTCDate())
          const dateStr = formatDateKey(localDate)
          allLogsMap[`${log.habitId}_${dateStr}`] = { completed: log.completed, isJoker: log.isJoker || false }
          
          // Trouver la première date de log (en utilisant la date locale)
          if (!minDate || localDate < minDate) {
            minDate = localDate
          }
        })
        setAllLogs(allLogsMap)
        setFirstLogDate(minDate)
      }

      // Récupérer les stats joker
      const jokerRes = await fetch(`/api/jokers?userId=${user.id}`)
      const jokerData = await jokerRes.json()
      if (jokerRes.ok) {
        setJokerStats(jokerData)
      }

      // Récupérer l'année de création du compte
      const userRes = await fetch(`/api/user/settings?userId=${user.id}`)
      const userData = await userRes.json()
      if (userRes.ok && userData.user?.createdAt) {
        setUserCreatedYear(new Date(userData.user.createdAt).getFullYear())
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleHabit = async (habitId: string, date: Date, useJokerMode: boolean = false) => {
    if (!user) return

    const dateStr = formatDateKey(date)
    const key = `${habitId}_${dateStr}`
    const currentData = logs[key] || { completed: false, isJoker: false }

    // Si on utilise un joker
    if (useJokerMode) {
      // Si c'est déjà un joker, on le retire
      if (currentData.completed && currentData.isJoker) {
        // On retire le joker
        const newData = { completed: false, isJoker: false }
        setLogs(prev => ({ ...prev, [key]: newData }))
        setAllLogs(prev => ({ ...prev, [key]: newData }))
        // Rendre le joker immédiatement
        setJokerStats(prev => ({
          ...prev,
          jokersUsed: prev.jokersUsed - 1,
          jokersRemaining: prev.jokersRemaining + 1,
        }))

        try {
          const res = await fetch('/api/habits/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              habitId,
              date: dateStr,
              completed: false,
              isJoker: false,
            }),
          })
          if (!res.ok) {
            // Revert on error
            setLogs(prev => ({ ...prev, [key]: currentData }))
            setAllLogs(prev => ({ ...prev, [key]: currentData }))
            setJokerStats(prev => ({
              ...prev,
              jokersUsed: prev.jokersUsed + 1,
              jokersRemaining: prev.jokersRemaining - 1,
            }))
          }
        } catch {
          setLogs(prev => ({ ...prev, [key]: currentData }))
          setAllLogs(prev => ({ ...prev, [key]: currentData }))
          setJokerStats(prev => ({
            ...prev,
            jokersUsed: prev.jokersUsed + 1,
            jokersRemaining: prev.jokersRemaining - 1,
          }))
        }
        return
      }

      // Vérifier s'il reste des jokers pour en ajouter un
      if (jokerStats.jokersRemaining <= 0) {
        alert('Plus de jokers disponibles pour cette période !')
        return
      }
      // Si déjà complété normalement, on ne peut pas utiliser de joker
      if (currentData.completed && !currentData.isJoker) {
        return
      }

      // Ajouter un joker
      const newData = { completed: true, isJoker: true }
      setLogs(prev => ({ ...prev, [key]: newData }))
      setAllLogs(prev => ({ ...prev, [key]: newData }))
      setJokerStats(prev => ({
        ...prev,
        jokersUsed: prev.jokersUsed + 1,
        jokersRemaining: prev.jokersRemaining - 1,
      }))

      try {
        const res = await fetch('/api/habits/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            habitId,
            date: dateStr,
            completed: true,
            isJoker: true,
          }),
        })
        if (!res.ok) {
          setLogs(prev => ({ ...prev, [key]: currentData }))
          setAllLogs(prev => ({ ...prev, [key]: currentData }))
          setJokerStats(prev => ({
            ...prev,
            jokersUsed: prev.jokersUsed - 1,
            jokersRemaining: prev.jokersRemaining + 1,
          }))
        }
      } catch {
        setLogs(prev => ({ ...prev, [key]: currentData }))
        setAllLogs(prev => ({ ...prev, [key]: currentData }))
        setJokerStats(prev => ({
          ...prev,
          jokersUsed: prev.jokersUsed - 1,
          jokersRemaining: prev.jokersRemaining + 1,
        }))
      }
      return
    }

    // Toggle normal (clic gauche)
    // Si c'est un joker, on le retire et on rend le joker
    if (currentData.completed && currentData.isJoker) {
      const newData = { completed: false, isJoker: false }
      setLogs(prev => ({ ...prev, [key]: newData }))
      setAllLogs(prev => ({ ...prev, [key]: newData }))
      // Rendre le joker immédiatement
      setJokerStats(prev => ({
        ...prev,
        jokersUsed: prev.jokersUsed - 1,
        jokersRemaining: prev.jokersRemaining + 1,
      }))

      try {
        const res = await fetch('/api/habits/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            habitId,
            date: dateStr,
            completed: false,
            isJoker: false,
          }),
        })
        if (!res.ok) {
          setLogs(prev => ({ ...prev, [key]: currentData }))
          setAllLogs(prev => ({ ...prev, [key]: currentData }))
          setJokerStats(prev => ({
            ...prev,
            jokersUsed: prev.jokersUsed + 1,
            jokersRemaining: prev.jokersRemaining - 1,
          }))
        }
      } catch {
        setLogs(prev => ({ ...prev, [key]: currentData }))
        setAllLogs(prev => ({ ...prev, [key]: currentData }))
        setJokerStats(prev => ({
          ...prev,
          jokersUsed: prev.jokersUsed + 1,
          jokersRemaining: prev.jokersRemaining - 1,
        }))
      }
      return
    }

    // Toggle normal sans joker
    const newCompleted = !currentData.completed
    const newData = { completed: newCompleted, isJoker: false }
    setLogs(prev => ({ ...prev, [key]: newData }))
    setAllLogs(prev => ({ ...prev, [key]: newData }))

    try {
      const res = await fetch('/api/habits/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          habitId,
          date: dateStr,
          completed: newCompleted,
          isJoker: false,
        }),
      })

      if (!res.ok) {
        setLogs(prev => ({ ...prev, [key]: currentData }))
        setAllLogs(prev => ({ ...prev, [key]: currentData }))
      }
    } catch {
      setLogs(prev => ({ ...prev, [key]: currentData }))
      setAllLogs(prev => ({ ...prev, [key]: currentData }))
    }
  }

  // Gestion clic droit pour joker (desktop)
  const handleContextMenu = (e: React.MouseEvent, habitId: string, date: Date, isFuture: boolean) => {
    e.preventDefault()
    if (!isFuture && jokerStats.jokerCount > 0) {
      toggleHabit(habitId, date, true)
    }
  }

  // Gestion du clic/tap - utilise jokerMode pour déterminer l'action
  const handleClick = (habitId: string, date: Date, isFuture: boolean) => {
    if (isFuture) return
    toggleHabit(habitId, date, jokerMode)
  }

  const goToPreviousWeek = () => {
    setCurrentWeekStart(prev => new Date(prev.getTime() - 7 * 24 * 60 * 60 * 1000))
  }

  const goToNextWeek = () => {
    setCurrentWeekStart(prev => new Date(prev.getTime() + 7 * 24 * 60 * 60 * 1000))
  }

  const goToCurrentWeek = () => {
    setCurrentWeekStart(getWeekStart(new Date()))
  }

  // Affichage du chargement
  if (authLoading || (loading && !categories.length)) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-pulse">📊</div>
      </main>
    )
  }

  const weekNumber = getWeekNumber(currentWeekStart)

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Salut {user?.pseudo} ! 👋
            </h1>
            <p className="text-dark-400">Ton tracker d&apos;habitudes personnel</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/settings" className="btn btn-ghost">
              ⚙️ Paramètres
            </Link>
            <Link href="/friends" className="btn btn-secondary relative">
              👥 Amis
              {pendingRequests > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {pendingRequests > 9 ? '9+' : pendingRequests}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Navigation semaine */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button onClick={goToPreviousWeek} className="btn btn-ghost">
            ← Semaine précédente
          </button>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-white">SEMAINE {weekNumber}</h2>
            <p className="text-sm text-dark-400">
              {formatDateShort(weekDays[0])} - {formatDateShort(weekDays[6])}
            </p>
          </div>
          <button onClick={goToNextWeek} className="btn btn-ghost">
            Semaine suivante →
          </button>
        </div>

        {isCurrentWeek(currentWeekStart) ? null : (
          <div className="text-center mb-4">
            <button 
              onClick={goToCurrentWeek} 
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-full text-sm font-medium shadow-lg shadow-primary-500/25 transition-all hover:scale-105"
            >
              <span>📅</span>
              Revenir à cette semaine
            </button>
          </div>
        )}

        {/* Tracker Grid */}
        {categories.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-5xl mb-4">📝</div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Aucune habitude configurée
            </h2>
            <p className="text-dark-400 mb-6">
              Commence par créer tes catégories et habitudes dans les paramètres.
            </p>
            <Link href="/settings" className="btn btn-primary">
              ⚙️ Configurer mes habitudes
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              {/* Header avec jours */}
              <thead>
                <tr className="bg-dark-900">
                  <th className="text-left p-3 min-w-[200px] border-b border-dark-700"></th>
                  {weekDays.map((day, idx) => {
                    const isToday = isSameDay(day, new Date())
                    return (
                      <th 
                        key={idx}
                        className={`p-2 text-center min-w-[50px] border-b border-dark-700 ${
                          isToday ? 'bg-primary-500/20' : ''
                        }`}
                      >
                        <div className={`text-xs uppercase ${isToday ? 'text-primary-400' : 'text-dark-400'}`}>
                          {getDayName(day)}
                        </div>
                        <div className={`text-sm font-semibold ${isToday ? 'text-primary-400' : 'text-white'}`}>
                          {day.getDate()}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <Fragment key={category.id}>
                    {/* Catégorie header */}
                    <tr className="bg-dark-800">
                      <td colSpan={8} className="p-3 font-semibold text-white">
                        <span className="mr-2">{category.icon}</span>
                        {category.name}
                      </td>
                    </tr>
                    {/* Habitudes */}
                    {category.habits.map((habit) => (
                      <tr 
                        key={habit.id}
                        className="border-b border-dark-800 hover:bg-dark-800/50 transition-colors"
                      >
                        <td className="p-3 text-dark-200">
                          {habit.name}
                          {habit.targetCount && (
                            <span className="text-dark-500 text-sm ml-1">
                              ({habit.targetCount})
                            </span>
                          )}
                        </td>
                        {weekDays.map((day, idx) => {
                          const dateStr = formatDateKey(day)
                          const key = `${habit.id}_${dateStr}`
                          const logData = logs[key] || { completed: false, isJoker: false }
                          const isCompleted = logData.completed
                          const isJoker = logData.isJoker
                          const isToday = isSameDay(day, new Date())
                          const isFuture = day > new Date()

                          return (
                            <td 
                              key={idx} 
                              className={`p-2 text-center ${isToday ? 'bg-primary-500/10' : ''}`}
                            >
                              <button
                                onClick={() => handleClick(habit.id, day, isFuture)}
                                onContextMenu={(e) => handleContextMenu(e, habit.id, day, isFuture)}
                                disabled={isFuture}
                                className={`w-8 h-8 rounded-md border-2 flex items-center justify-center mx-auto transition-all ${
                                  isFuture 
                                    ? 'border-dark-700 bg-dark-900 cursor-not-allowed opacity-30'
                                    : isCompleted && isJoker
                                      ? 'border-purple-500 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                                      : isCompleted
                                        ? 'border-green-500 bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                        : jokerMode
                                          ? 'border-amber-500 bg-amber-500/10 hover:bg-amber-500/20 ring-1 ring-amber-400/50'
                                          : 'border-dark-600 bg-dark-900 hover:border-dark-500 hover:bg-dark-800'
                                }`}
                                title={jokerMode ? 'Cliquer pour utiliser un joker' : isJoker ? 'Joker utilisé' : isCompleted ? 'Complété' : 'Clic droit pour joker'}
                              >
                                {isCompleted ? (isJoker ? '🃏' : '✓') : ''}
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Stats détaillées */}
        {categories.length > 0 && (
          <div className="mt-8 space-y-6">
            {/* Stats rapides */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon="✅"
                label="Aujourd'hui"
                value={`${getTodayCompletionRate(categories, logs, new Date())}%`}
                subValue={getTodayCount(categories, logs, new Date())}
                color="green"
              />
              <StatCard
                icon="📅"
                label="Cette semaine"
                value={`${getWeekCompletionRate(categories, logs, weekDays)}%`}
                subValue={getWeekCount(categories, logs, weekDays)}
                color="blue"
              />
              <StatCard
                icon="🔥"
                label="Habitudes"
                value={getTotalHabits(categories).toString()}
                color="orange"
              />
              <StatCard
                icon="📊"
                label="Catégories"
                value={categories.length.toString()}
                color="purple"
              />
            </div>

            {/* Jokers restants + Toggle Mode */}
            {jokerStats.jokerCount > 0 && (
              <div className={`rounded-xl p-4 transition-all ${
                jokerMode 
                  ? 'bg-gradient-to-r from-amber-500/30 to-orange-500/30 border-2 border-amber-400 shadow-lg shadow-amber-500/20' 
                  : 'bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-500/30'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🃏</span>
                    <div>
                      <div className="text-white font-semibold">Jokers disponibles</div>
                      <div className="text-purple-300 text-sm">
                        {jokerStats.jokerPeriod === 'week' ? 'Cette semaine' : 
                         jokerStats.jokerPeriod === 'month' ? 'Ce mois' : 'Cette année'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right mr-4">
                    <div className="text-2xl font-bold text-purple-300">
                      {jokerStats.jokersRemaining}/{jokerStats.jokerCount}
                    </div>
                    <div className="text-xs text-purple-400">
                      {jokerStats.jokersUsed} utilisé{jokerStats.jokersUsed > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                
                {/* Bouton Mode Joker */}
                <button
                  onClick={() => setJokerMode(!jokerMode)}
                  className={`mt-3 w-full py-2 px-4 rounded-lg font-semibold transition-all ${
                    jokerMode
                      ? 'bg-amber-500 text-black hover:bg-amber-400 animate-pulse'
                      : 'bg-purple-600 text-white hover:bg-purple-500'
                  }`}
                >
                  {jokerMode ? '🃏 MODE JOKER ACTIF - Cliquer pour désactiver' : '🃏 Activer le mode Joker'}
                </button>
                {jokerMode && (
                  <p className="text-amber-300 text-xs text-center mt-2">
                    Cliquez sur une case pour utiliser/retirer un joker
                  </p>
                )}
              </div>
            )}

            {/* Sélecteur de période pour stats avancées */}
            <div className="card">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h3 className="text-lg font-semibold text-white">📈 Statistiques par période</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'week', label: 'Semaine' },
                    { id: 'month', label: 'Mois' },
                    { id: 'year', label: 'Année' },
                    { id: 'custom', label: 'Période' },
                    { id: 'all', label: 'Tout' },
                  ].map(period => (
                    <button
                      key={period.id}
                      onClick={() => setStatsPeriod(period.id as typeof statsPeriod)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        statsPeriod === period.id
                          ? 'bg-primary-500 text-white'
                          : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                      }`}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sélecteur de mois si période = mois */}
              {statsPeriod === 'month' && (
                <div className="flex flex-wrap gap-3 mb-4 p-3 bg-dark-800/50 rounded-xl">
                  <div className="flex flex-wrap gap-1">
                    {MONTHS.map((month, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedMonth(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          selectedMonth === idx
                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                            : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                        }`}
                      >
                        {month.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1 border-l border-dark-600 pl-3">
                    {getYearOptions(userCreatedYear).map(year => (
                      <button
                        key={year}
                        onClick={() => setSelectedYear(year)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          selectedYear === year
                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                            : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sélecteur d'année si période = année */}
              {statsPeriod === 'year' && (
                <div className="flex flex-wrap gap-2 mb-4 p-3 bg-dark-800/50 rounded-xl">
                  {getYearOptions(userCreatedYear).map(year => (
                    <button
                      key={year}
                      onClick={() => setSelectedYear(year)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedYear === year
                          ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                          : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}

              {/* Sélecteur de période personnalisée */}
              {statsPeriod === 'custom' && (
                <div className="flex flex-wrap gap-3 mb-4 p-3 bg-dark-800/50 rounded-xl items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-dark-400 font-medium">Du</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:border-primary-500 focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-dark-400 font-medium">au</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      max={formatDateKey(new Date())}
                      className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:border-primary-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Stats par habitude */}
              <div className="space-y-3">
                {categories.map(category => (
                  <div key={category.id}>
                    <div className="text-sm font-medium text-dark-400 mb-2">
                      {category.icon} {category.name}
                    </div>
                    {category.habits.map(habit => {
                      const stats = getHabitStats(habit, allLogs, statsPeriod, selectedMonth, selectedYear, customStartDate, customEndDate, firstLogDate)
                      return (
                        <div key={habit.id} className="flex items-center justify-between py-2 px-3 bg-dark-900 rounded-lg mb-1">
                          <span className="text-dark-200 text-sm">{habit.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-dark-400 text-sm">{stats.completed}/{stats.total}</span>
                            <div className="w-20 h-2 bg-dark-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-primary-500 to-green-500 transition-all duration-300"
                                style={{ width: `${stats.percentage}%` }}
                              />
                            </div>
                            <span className={`text-sm font-medium min-w-[3rem] text-right ${
                              stats.percentage >= 80 ? 'text-green-400' :
                              stats.percentage >= 50 ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>
                              {stats.percentage}%
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>

              {/* Total de la période */}
              {(() => {
                const totalStats = getTotalStats(categories, allLogs, statsPeriod, selectedMonth, selectedYear, customStartDate, customEndDate, firstLogDate)
                return (
                  <div className="mt-4 pt-4 border-t border-dark-700 flex items-center justify-between">
                    <span className="text-white font-medium">Total période</span>
                    <div className="flex items-center gap-4">
                      <span className="text-dark-300">{totalStats.completed}/{totalStats.total}</span>
                      <span className={`text-lg font-bold ${
                        totalStats.percentage >= 80 ? 'text-green-400' :
                        totalStats.percentage >= 50 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {totalStats.percentage}%
                      </span>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

function StatCard({ icon, label, value, subValue, color }: { icon: string; label: string; value: string; subValue?: string; color: string }) {
  const colorClasses = {
    green: 'from-green-500/20 to-green-600/10 border-green-500/30',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
  }[color] || 'from-dark-700 to-dark-800 border-dark-600'

  return (
    <div className={`rounded-xl border bg-gradient-to-br p-4 ${colorClasses}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {subValue && <div className="text-xs text-dark-500">{subValue}</div>}
      <div className="text-sm text-dark-400">{label}</div>
    </div>
  )
}

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

// Utility functions

// Formater une date en YYYY-MM-DD (locale, pas UTC) - IMPORTANT: utilisé partout
function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Lundi comme début
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekDays(weekStart: Date): Date[] {
  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart)
    day.setDate(weekStart.getDate() + i)
    days.push(day)
  }
  return days
}

function getWeekNumber(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1)
  const diff = date.getTime() - startOfYear.getTime()
  const oneWeek = 7 * 24 * 60 * 60 * 1000
  return Math.ceil(diff / oneWeek)
}

function getDayName(date: Date): string {
  return date.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 2)
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function isSameDay(d1: Date, d2: Date): boolean {
  return formatDateKey(d1) === formatDateKey(d2)
}

function isCurrentWeek(weekStart: Date): boolean {
  const currentWeekStart = getWeekStart(new Date())
  return weekStart.getTime() === currentWeekStart.getTime()
}

function getTodayCompletionRate(categories: Category[], logs: LogsMap, today: Date): number {
  const dateStr = formatDateKey(today)
  let total = 0
  let completed = 0

  categories.forEach(cat => {
    cat.habits.filter(h => h.frequency === 'daily').forEach(habit => {
      const logData = logs[`${habit.id}_${dateStr}`]
      // Si c'est un joker, on ne compte pas ce jour du tout
      if (logData?.isJoker) return
      total++
      if (logData?.completed) completed++
    })
  })

  return total > 0 ? Math.round((completed / total) * 100) : 0
}

function getWeekCompletionRate(categories: Category[], logs: LogsMap, weekDays: Date[]): number {
  let total = 0
  let completed = 0
  const today = new Date()

  categories.forEach(cat => {
    cat.habits.forEach(habit => {
      if (habit.frequency === 'daily') {
        weekDays.forEach(day => {
          if (day <= today) {
            const dateStr = formatDateKey(day)
            const logData = logs[`${habit.id}_${dateStr}`]
            // Si c'est un joker, on ne compte pas ce jour du tout
            if (logData?.isJoker) return
            total++
            if (logData?.completed) completed++
          }
        })
      } else {
        // Weekly habits - vérifier s'il y a un joker dans la semaine
        const hasJoker = weekDays.some(day => {
          const dateStr = formatDateKey(day)
          return logs[`${habit.id}_${dateStr}`]?.isJoker
        })
        if (hasJoker) return // Toute la semaine est "jokée"
        
        total++
        const completedThisWeek = weekDays.some(day => {
          const dateStr = formatDateKey(day)
          return logs[`${habit.id}_${dateStr}`]?.completed
        })
        if (completedThisWeek) completed++
      }
    })
  })

  return total > 0 ? Math.round((completed / total) * 100) : 0
}

function getTotalHabits(categories: Category[]): number {
  return categories.reduce((acc, cat) => acc + cat.habits.length, 0)
}

// Compte X/Y pour aujourd'hui (jokers exclus)
function getTodayCount(categories: Category[], logs: LogsMap, today: Date): string {
  const dateStr = formatDateKey(today)
  let total = 0
  let completed = 0

  categories.forEach(cat => {
    cat.habits.filter(h => h.frequency === 'daily').forEach(habit => {
      const logData = logs[`${habit.id}_${dateStr}`]
      // Si c'est un joker, on ne compte pas ce jour du tout
      if (logData?.isJoker) return
      total++
      if (logData?.completed) completed++
    })
  })

  return `${completed}/${total}`
}

// Compte X/Y pour la semaine (jokers exclus)
function getWeekCount(categories: Category[], logs: LogsMap, weekDays: Date[]): string {
  let total = 0
  let completed = 0
  const today = new Date()

  categories.forEach(cat => {
    cat.habits.forEach(habit => {
      if (habit.frequency === 'daily') {
        weekDays.forEach(day => {
          if (day <= today) {
            const dateStr = formatDateKey(day)
            const logData = logs[`${habit.id}_${dateStr}`]
            // Si c'est un joker, on ne compte pas ce jour du tout
            if (logData?.isJoker) return
            total++
            if (logData?.completed) completed++
          }
        })
      } else {
        // Weekly habits
        const hasJoker = weekDays.some(day => {
          const dateStr = formatDateKey(day)
          return logs[`${habit.id}_${dateStr}`]?.isJoker
        })
        if (hasJoker) return
        
        total++
        const completedThisWeek = weekDays.some(day => {
          const dateStr = formatDateKey(day)
          return logs[`${habit.id}_${dateStr}`]?.completed
        })
        if (completedThisWeek) completed++
      }
    })
  })

  return `${completed}/${total}`
}

// Générer la liste des années disponibles
function getYearOptions(startYear: number): number[] {
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let year = startYear; year <= currentYear; year++) {
    years.push(year)
  }
  return years
}

// Stats pour une habitude sur une période (jokers exclus du total)
function getHabitStats(
  habit: Habit, 
  logs: LogsMap, 
  period: 'week' | 'month' | 'year' | 'all' | 'custom',
  selectedMonth: number,
  selectedYear: number,
  customStartDate?: string,
  customEndDate?: string,
  firstLogDate?: Date | null
): { completed: number; total: number; percentage: number } {
  const today = new Date()
  const dates = getPeriodDates(period, selectedMonth, selectedYear, customStartDate, customEndDate, firstLogDate)
  
  let total = 0
  let completed = 0

  if (habit.frequency === 'daily') {
    dates.forEach(date => {
      if (date <= today) {
        const dateStr = formatDateKey(date)
        const logData = logs[`${habit.id}_${dateStr}`]
        // Si c'est un joker, on ne compte pas ce jour du tout
        if (logData?.isJoker) return
        total++
        if (logData?.completed) completed++
      }
    })
  } else {
    // Weekly: compter par semaine
    const weeks = getWeeksInPeriod(dates)
    weeks.forEach(weekDays => {
      const hasCompletedDay = weekDays.some(day => day <= today)
      if (hasCompletedDay) {
        // Vérifier s'il y a un joker dans la semaine
        const hasJoker = weekDays.some(day => {
          const dateStr = formatDateKey(day)
          return logs[`${habit.id}_${dateStr}`]?.isJoker
        })
        if (hasJoker) return // Semaine jokée = exclue du total
        
        total++
        const completedThisWeek = weekDays.some(day => {
          const dateStr = formatDateKey(day)
          return logs[`${habit.id}_${dateStr}`]?.completed
        })
        if (completedThisWeek) completed++
      }
    })
  }

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  return { completed, total, percentage }
}

// Stats totales pour toutes les habitudes
function getTotalStats(
  categories: Category[],
  logs: LogsMap,
  period: 'week' | 'month' | 'year' | 'all' | 'custom',
  selectedMonth: number,
  selectedYear: number,
  customStartDate?: string,
  customEndDate?: string,
  firstLogDate?: Date | null
): { completed: number; total: number; percentage: number } {
  let totalCompleted = 0
  let totalCount = 0

  categories.forEach(cat => {
    cat.habits.forEach(habit => {
      const stats = getHabitStats(habit, logs, period, selectedMonth, selectedYear, customStartDate, customEndDate, firstLogDate)
      totalCompleted += stats.completed
      totalCount += stats.total
    })
  })

  const percentage = totalCount > 0 ? Math.round((totalCompleted / totalCount) * 100) : 0
  return { completed: totalCompleted, total: totalCount, percentage }
}

// Générer les dates d'une période
function getPeriodDates(
  period: 'week' | 'month' | 'year' | 'all' | 'custom', 
  selectedMonth: number, 
  selectedYear: number,
  customStartDate?: string,
  customEndDate?: string,
  firstLogDate?: Date | null
): Date[] {
  const dates: Date[] = []
  const today = new Date()
  let startDate: Date
  let endDate: Date = today

  switch (period) {
    case 'week':
      startDate = getWeekStart(today)
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      break
    case 'month':
      startDate = new Date(selectedYear, selectedMonth, 1)
      endDate = new Date(selectedYear, selectedMonth + 1, 0)
      break
    case 'year':
      startDate = new Date(selectedYear, 0, 1)
      endDate = new Date(selectedYear, 11, 31)
      break
    case 'custom':
      startDate = customStartDate ? new Date(customStartDate) : new Date()
      endDate = customEndDate ? new Date(customEndDate) : new Date()
      break
    case 'all':
      // Commencer à partir du premier log, ou aujourd'hui si pas de logs
      startDate = firstLogDate ? new Date(firstLogDate) : today
      break
  }

  // Limiter à aujourd'hui
  if (endDate > today) endDate = today

  const current = new Date(startDate)
  while (current <= endDate) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  return dates
}

// Grouper les dates par semaine
function getWeeksInPeriod(dates: Date[]): Date[][] {
  const weeks: Date[][] = []
  let currentWeek: Date[] = []
  let currentWeekStart: number | null = null

  dates.forEach(date => {
    const weekStart = getWeekStart(date).getTime()
    if (currentWeekStart !== weekStart) {
      if (currentWeek.length > 0) {
        weeks.push(currentWeek)
      }
      currentWeek = [date]
      currentWeekStart = weekStart
    } else {
      currentWeek.push(date)
    }
  })

  if (currentWeek.length > 0) {
    weeks.push(currentWeek)
  }

  return weeks
}
