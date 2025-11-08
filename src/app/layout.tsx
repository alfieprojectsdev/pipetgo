import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { AuthProvider } from '@/components/auth-provider'
import { GoatCounterTracker } from '@/components/analytics/goatcounter-tracker'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PipetGo - Lab Services Marketplace',
  description: 'Connect with certified laboratories for testing services',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>

        {/* GoatCounter Analytics - Level 1 (Page Views Only) */}
        {process.env.NEXT_PUBLIC_GOATCOUNTER_URL && (
          <>
            <GoatCounterTracker />
            <Script
              data-goatcounter={process.env.NEXT_PUBLIC_GOATCOUNTER_URL}
              async
              src="//gc.zgo.at/count.js"
              strategy="afterInteractive"
            />
          </>
        )}
      </body>
    </html>
  )
}
