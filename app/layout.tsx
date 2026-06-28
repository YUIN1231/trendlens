import type { Metadata, Viewport } from 'next'
import './globals.css'
import BottomNav from './components/BottomNav'
import { Analytics } from '@vercel/analytics/react'

export const metadata: Metadata = {
  title: 'TrendLens — Find what\'s rising or falling',
  description: 'AI-powered Google Maps trend detector. See which restaurants, cafés, and shops are rising or falling — any city, any category.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'TrendLens' },
}

export const viewport: Viewport = {
  themeColor: '#F5F4F0',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <BottomNav />
        <Analytics />
      </body>
    </html>
  )
}
