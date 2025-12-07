import type { Metadata, Viewport } from 'next'
import { Outfit, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import Providers from './components/Providers'
import Header from './components/Header'
import PWARegister from './components/PWARegister'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://habittracker.app'),
  title: 'HabitTracker - Suivi d\'habitudes entre amis',
  description: 'Suivez vos habitudes quotidiennes, partagez vos progrès avec vos amis et restez motivé. Application gratuite de suivi d\'habitudes.',
  keywords: ['habitudes', 'tracker', 'suivi', 'motivation', 'amis', 'objectifs', 'routine', 'productivité'],
  authors: [{ name: 'HabitTracker Team' }],
  creator: 'HabitTracker',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'HabitTracker',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://habittracker.app',
    siteName: 'HabitTracker',
    title: 'HabitTracker - Suivi d\'habitudes entre amis',
    description: 'Suivez vos habitudes quotidiennes, partagez vos progrès avec vos amis et restez motivé.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'HabitTracker - Suivi d\'habitudes',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HabitTracker - Suivi d\'habitudes entre amis',
    description: 'Suivez vos habitudes quotidiennes, partagez vos progrès avec vos amis et restez motivé.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <head>
        {/* PWA Meta Tags for iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="HabitTracker" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Splash screens for iOS */}
        <link rel="apple-touch-startup-image" href="/icons/icon-512x512.png" />
        
        {/* Windows Tiles */}
        <meta name="msapplication-TileColor" content="#6366f1" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
      </head>
      <body className={`${outfit.variable} ${jetbrainsMono.variable} antialiased min-h-screen`}>
        <Providers>
          <Header />
        {children}
          <PWARegister />
        </Providers>
      </body>
    </html>
  )
}
