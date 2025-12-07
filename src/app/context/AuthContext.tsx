'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface User {
  id: string
  pseudo: string
  avatar: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (userData: User) => void
  logout: () => void
  updateUser: (userData: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Pages accessibles sans connexion
const PUBLIC_PATHS = ['/login', '/register']

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Charger la session au démarrage
  useEffect(() => {
    const loadSession = () => {
      try {
        const userId = localStorage.getItem('userId')
        const userPseudo = localStorage.getItem('userPseudo')
        const userAvatar = localStorage.getItem('userAvatar')

        if (userId && userPseudo) {
          setUser({
            id: userId,
            pseudo: userPseudo,
            avatar: userAvatar || '👤',
          })
        } else {
          // Nettoyer si données partielles
          clearSession()
        }
      } catch (error) {
        console.error('Error loading session:', error)
        clearSession()
      } finally {
        setIsLoading(false)
      }
    }

    loadSession()
  }, [])

  // Rediriger si non connecté sur une page protégée
  useEffect(() => {
    if (!isLoading) {
      const isPublicPath = PUBLIC_PATHS.includes(pathname)
      
      if (!user && !isPublicPath) {
        router.push('/login')
      } else if (user && isPublicPath) {
        router.push('/')
      }
    }
  }, [user, isLoading, pathname, router])

  const clearSession = () => {
    localStorage.removeItem('userId')
    localStorage.removeItem('userPseudo')
    localStorage.removeItem('userAvatar')
    setUser(null)
  }

  const login = (userData: User) => {
    localStorage.setItem('userId', userData.id)
    localStorage.setItem('userPseudo', userData.pseudo)
    localStorage.setItem('userAvatar', userData.avatar || '👤')
    setUser(userData)
  }

  const logout = () => {
    clearSession()
    router.push('/login')
  }

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData }
      setUser(updatedUser)
      
      if (userData.pseudo) localStorage.setItem('userPseudo', userData.pseudo)
      if (userData.avatar) localStorage.setItem('userAvatar', userData.avatar)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

