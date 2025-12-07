'use client'

import { useState, useEffect, Fragment, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'

interface Habit {
  id: string
  name: string
  frequency: string
  targetCount: number | null
}

interface Category {
  id: string
  name: string
  icon: string
  habits: Habit[]
}

interface TrackerUser {
  id: string
  pseudo: string
  avatar: string
  createdAt?: string
}

interface LogData {
  completed: boolean
  isJoker: boolean
}

interface LogsMap {
  [key: string]: LogData
}

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

export default function ViewTrackerPage() {
  const params = useParams()
  const targetUserId = params.userId as string
  const { user: authUser, isLoading: authLoading } = useAuth()
  
  const [trackerUser, setTrackerUser] = useState<TrackerUser | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [logs, setLogs] = useState<LogsMap>({})
  const [allLogs, setAllLogs] = useState<LogsMap>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()))
  const [firstLogDate, setFirstLogDate] = useState<Date | null>(null)
  
  // Stats
  const [statsPeriod, setStatsPeriod] = useState<'week' | 'month' | 'year' | 'all' | 'custom'>('week')
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [customStartDate, setCustomStartDate] = useState<string>(formatDateKey(new Date()))
  const [customEndDate, setCustomEndDate] = useState<string>(formatDateKey(new Date()))
  const [userCreatedYear, setUserCreatedYear] = useState<number>(new Date().getFullYear())

  const weekDays = getWeekDays(currentWeekStart)

  const fetchData = useCallback(async () => {
    if (!authUser) return

    setLoading(true)
    setError('')

    try {
      const startDate = currentWeekStart.toISOString().split('T')[0]
      const endDate = new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const url = `/api/friends/${targetUserId}/tracker?startDate=${startDate}&endDate=${endDate}&viewerId=${authUser.id}`

      const res = await fetch(url)
      const data = await res.json()

      if (res.ok) {
        setTrackerUser(data.user)
        setCategories(data.categories)
        
        if (data.user?.createdAt) {
          setUserCreatedYear(new Date(data.user.createdAt).getFullYear())
        }
        
        // Convert logs to LogData format
        const logsMap: LogsMap = {}
        Object.entries(data.logs || {}).forEach(([key, value]) => {
          if (typeof value === 'boolean') {
            logsMap[key] = { completed: value, isJoker: false }
          } else {
            logsMap[key] = value as LogData
          }
        })
        setLogs(logsMap)

        // Fetch all logs for stats
        const veryOldDate = '2020-01-01'
        const today = new Date().toISOString().split('T')[0]
        const allUrl = `/api/friends/${targetUserId}/tracker?startDate=${veryOldDate}&endDate=${today}&viewerId=${authUser.id}`
        const allRes = await fetch(allUrl)
        const allData = await allRes.json()
        if (allRes.ok) {
          const allLogsMap: LogsMap = {}
          let minDate: Date | null = null
          
          Object.entries(allData.logs || {}).forEach(([key, value]) => {
            if (typeof value === 'boolean') {
              allLogsMap[key] = { completed: value, isJoker: false }
            } else {
              allLogsMap[key] = value as LogData
            }
            // Extraire la date du key pour trouver la première
            const dateStr = key.split('_')[1]
            if (dateStr) {
              const date = new Date(dateStr)
              if (!minDate || date < minDate) {
                minDate = date
              }
            }
          })
          setAllLogs(allLogsMap)
          setFirstLogDate(minDate)
        }
      } else {
        setError(data.error || 'Erreur lors du chargement')
      }
    } catch {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }, [authUser, targetUserId, currentWeekStart])

  useEffect(() => {
    if (authUser && !authLoading) {
      fetchData()
    }
  }, [authUser, authLoading, fetchData])

  const goToPreviousWeek = () => {
    setCurrentWeekStart(prev => new Date(prev.getTime() - 7 * 24 * 60 * 60 * 1000))
  }

  const goToNextWeek = () => {
    setCurrentWeekStart(prev => new Date(prev.getTime() + 7 * 24 * 60 * 60 * 1000))
  }

  const goToCurrentWeek = () => {
    setCurrentWeekStart(getWeekStart(new Date()))
  }

  // Calculs de stats
  const getTodayCompletionRate = () => {
    let total = 0
    let completed = 0
    const today = new Date()
    const dateStr = formatDateKey(today)
    
    categories.forEach(cat => {
      cat.habits.forEach(habit => {
        if (habit.frequency === 'daily') {
          const logData = allLogs[`${habit.id}_${dateStr}`]
          if (logData?.isJoker) return
          total++
          if (logData?.completed) completed++
        }
      })
    })
    
    return total > 0 ? Math.round((completed / total) * 100) : 0
  }

  const getWeekCompletionRate = () => {
    let total = 0
    let completed = 0
    const today = new Date()
    const currentWeek = getWeekDays(getWeekStart(today))
    
    categories.forEach(cat => {
      cat.habits.forEach(habit => {
        if (habit.frequency === 'daily') {
          currentWeek.forEach(day => {
            if (day <= today) {
              const dateStr = formatDateKey(day)
              const logData = allLogs[`${habit.id}_${dateStr}`]
              if (logData?.isJoker) return
              total++
              if (logData?.completed) completed++
            }
          })
        } else {
          const hasJoker = currentWeek.some(day => {
            const dateStr = formatDateKey(day)
            return allLogs[`${habit.id}_${dateStr}`]?.isJoker
          })
          if (hasJoker) return
          total++
          const completedThisWeek = currentWeek.some(day => {
            const dateStr = formatDateKey(day)
            return allLogs[`${habit.id}_${dateStr}`]?.completed
          })
          if (completedThisWeek) completed++
        }
      })
    })
    
    return total > 0 ? Math.round((completed / total) * 100) : 0
  }

  const getTodayCount = () => {
    let total = 0
    let completed = 0
    const today = new Date()
    const dateStr = formatDateKey(today)
    
    categories.forEach(cat => {
      cat.habits.forEach(habit => {
        if (habit.frequency === 'daily') {
          const logData = allLogs[`${habit.id}_${dateStr}`]
          if (logData?.isJoker) return
          total++
          if (logData?.completed) completed++
        }
      })
    })
    
    return { completed, total }
  }

  const getWeekCount = () => {
    let total = 0
    let completed = 0
    const today = new Date()
    const currentWeek = getWeekDays(getWeekStart(today))
    
    categories.forEach(cat => {
      cat.habits.forEach(habit => {
        if (habit.frequency === 'daily') {
          currentWeek.forEach(day => {
            if (day <= today) {
              const dateStr = formatDateKey(day)
              const logData = allLogs[`${habit.id}_${dateStr}`]
              if (logData?.isJoker) return
              total++
              if (logData?.completed) completed++
            }
          })
        } else {
          const hasJoker = currentWeek.some(day => {
            const dateStr = formatDateKey(day)
            return allLogs[`${habit.id}_${dateStr}`]?.isJoker
          })
          if (hasJoker) return
          total++
          const completedThisWeek = currentWeek.some(day => {
            const dateStr = formatDateKey(day)
            return allLogs[`${habit.id}_${dateStr}`]?.completed
          })
          if (completedThisWeek) completed++
        }
      })
    })
    
    return { completed, total }
  }

  if (authLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-pulse">👁️</div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="card text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold text-white mb-2">{error}</h2>
          <Link href="/friends" className="btn btn-primary mt-4">
            ← Retour aux amis
          </Link>
        </div>
      </main>
    )
  }

  if (!trackerUser) return null

  const weekNumber = getWeekNumber(currentWeekStart)
  const isCurrentWeek = isSameDay(currentWeekStart, getWeekStart(new Date()))
  const todayStats = getTodayCount()
  const weekStats = getWeekCount()
  const yearOptions = getYearOptions(userCreatedYear)

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/friends" className="btn btn-ghost">
            ← Retour aux amis
          </Link>
          <div className="text-center">
            <div className="text-3xl mb-1">{trackerUser.avatar}</div>
            <h1 className="text-xl font-bold text-white">{trackerUser.pseudo}</h1>
          </div>
          <div className="w-24" />
        </div>

        {/* Stats rapides */}
        {categories.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon="📅"
              value={`${getTodayCompletionRate()}%`}
              label="Aujourd'hui"
              sublabel={`${todayStats.completed}/${todayStats.total}`}
              color="blue"
            />
            <StatCard
              icon="📊"
              value={`${getWeekCompletionRate()}%`}
              label="Cette semaine"
              sublabel={`${weekStats.completed}/${weekStats.total}`}
              color="green"
            />
            <StatCard
              icon="🎯"
              value={`${getTotalHabits(categories)}`}
              label="Habitudes"
              color="orange"
            />
            <StatCard
              icon="📁"
              value={`${categories.length}`}
              label="Catégories"
              color="purple"
            />
          </div>
        )}

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

        {!isCurrentWeek && (
          <div className="text-center mb-4">
            <button onClick={goToCurrentWeek} className="btn btn-primary btn-sm">
              📅 Revenir à cette semaine
            </button>
          </div>
        )}

        {/* Tracker Grid (lecture seule) */}
        {categories.length === 0 ? (
          <div className="card text-center py-8">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-dark-400">
              {trackerUser.pseudo} n&apos;a pas encore configuré ses habitudes.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
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
                    <tr className="bg-dark-800">
                      <td colSpan={8} className="p-3 font-semibold text-white">
                        <span className="mr-2">{category.icon}</span>
                        {category.name}
                      </td>
                    </tr>
                    {category.habits.map((habit) => (
                      <tr 
                        key={habit.id}
                        className="border-b border-dark-800"
                      >
                        <td className="p-3 text-dark-200">
                          {habit.name}
                        </td>
                        {weekDays.map((day, idx) => {
                          const dateStr = formatDateKey(day)
                          const key = `${habit.id}_${dateStr}`
                          const logData = logs[key]
                          const isCompleted = logData?.completed || false
                          const isJoker = logData?.isJoker || false
                          const isToday = isSameDay(day, new Date())
                          const isFuture = day > new Date()

                          return (
                            <td 
                              key={idx} 
                              className={`p-2 text-center ${isToday ? 'bg-primary-500/10' : ''}`}
                            >
                              <div
                                className={`w-8 h-8 rounded-md border-2 flex items-center justify-center mx-auto ${
                                  isFuture 
                                    ? 'border-dark-700 bg-dark-900 opacity-30'
                                    : isCompleted && isJoker
                                      ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                                      : isCompleted
                                        ? 'border-green-500 bg-green-500/20 text-green-400'
                                        : 'border-dark-600 bg-dark-900'
                                }`}
                              >
                                {isCompleted && isJoker ? '🃏' : isCompleted ? '✓' : ''}
                              </div>
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

        {/* Stats par période */}
        {categories.length > 0 && (
          <div className="mt-8">
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

              {/* Sélecteur de mois pour la période "mois" */}
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
                    {yearOptions.map(year => (
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

              {/* Sélecteur d'année */}
              {statsPeriod === 'year' && (
                <div className="flex flex-wrap gap-2 mb-4 p-3 bg-dark-800/50 rounded-xl">
                  {yearOptions.map(year => (
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

              {/* Période personnalisée */}
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
                      className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:border-primary-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Stats par habitude */}
              <div className="space-y-4">
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

// Composant StatCard
function StatCard({ icon, value, label, sublabel, color }: {
  icon: string
  value: string
  label: string
  sublabel?: string
  color: 'blue' | 'green' | 'orange' | 'purple'
}) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30',
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
  }
  
  return (
    <div className={`card bg-gradient-to-br ${colorClasses[color]}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-dark-400">{label}</div>
      {sublabel && <div className="text-xs text-dark-500">{sublabel}</div>}
    </div>
  )
}

// Utility functions
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
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

function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isSameDay(d1: Date, d2: Date): boolean {
  return formatDateKey(d1) === formatDateKey(d2)
}

function getTotalHabits(categories: Category[]): number {
  return categories.reduce((acc, cat) => acc + cat.habits.length, 0)
}

function getYearOptions(startYear: number): number[] {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let year = startYear; year <= currentYear; year++) {
    years.push(year)
  }
  return years
}

// Stats pour une habitude sur une période
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
        if (logData?.isJoker) return
        total++
        if (logData?.completed) completed++
      }
    })
  } else {
    const weeks = getWeeksInPeriod(dates)
    weeks.forEach(weekDays => {
      const hasCompletedDay = weekDays.some(day => day <= today)
      if (hasCompletedDay) {
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
  }

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  return { completed, total, percentage }
}

// Stats totales
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
      startDate = firstLogDate ? new Date(firstLogDate) : today
      break
  }

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
