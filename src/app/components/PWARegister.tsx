'use client'

import { useEffect, useState } from 'react'

export default function PWARegister() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSPrompt, setShowIOSPrompt] = useState(false)

  useEffect(() => {
    // Enregistrer le service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker enregistré:', registration.scope)
        })
        .catch((error) => {
          console.log('Erreur Service Worker:', error)
        })
    }

    // Détecter iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(isIOSDevice)

    // Vérifier si déjà installé
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (navigator as any).standalone === true

    // Écouter l'événement beforeinstallprompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      // Ne montrer que si pas déjà installé et pas déjà refusé
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      if (!isStandalone && !dismissed) {
        setShowInstallPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Pour iOS, montrer un prompt personnalisé si pas installé
    if (isIOSDevice && !isStandalone) {
      const dismissed = localStorage.getItem('pwa-ios-dismissed')
      if (!dismissed) {
        // Attendre un peu avant de montrer
        setTimeout(() => setShowIOSPrompt(true), 3000)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('PWA installée')
    }
    
    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    setShowIOSPrompt(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
    localStorage.setItem('pwa-ios-dismissed', 'true')
  }

  // Prompt pour Android/Chrome
  if (showInstallPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-dark-800 border border-dark-700 rounded-2xl p-4 shadow-2xl z-50 animate-slide-up">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">BC</span>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-1">Installer Boot Camp</h3>
            <p className="text-dark-400 text-sm mb-3">
              Ajoute l&apos;app sur ton écran d&apos;accueil pour un accès rapide !
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Installer
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-dark-400 hover:text-dark-300 text-sm transition-colors"
              >
                Plus tard
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-dark-500 hover:text-dark-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  // Prompt pour iOS
  if (showIOSPrompt && isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-dark-800 border border-dark-700 rounded-2xl p-4 shadow-2xl z-50 animate-slide-up">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">BC</span>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-1">Installer Boot Camp</h3>
            <p className="text-dark-400 text-sm mb-3">
              Pour installer l&apos;app sur ton iPhone/iPad :
            </p>
            <ol className="text-dark-300 text-sm space-y-1 mb-3">
              <li className="flex items-center gap-2">
                <span className="text-primary-400">1.</span> Appuie sur 
                <svg className="w-5 h-5 text-primary-400 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                (Partager)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary-400">2.</span> Sélectionne &quot;Sur l&apos;écran d&apos;accueil&quot;
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary-400">3.</span> Confirme avec &quot;Ajouter&quot;
              </li>
            </ol>
            <button
              onClick={handleDismiss}
              className="text-dark-400 hover:text-dark-300 text-sm transition-colors"
            >
              J&apos;ai compris
            </button>
          </div>
          <button
            onClick={handleDismiss}
            className="text-dark-500 hover:text-dark-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return null
}

