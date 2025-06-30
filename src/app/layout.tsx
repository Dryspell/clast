import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { MDXClientWrapper } from '@/components/mdx-client-wrapper'
import { SiteHeader } from '@/components/SiteHeader'
import { ConvexClientProviderWithAuth } from '@/app/ConvexClientProviderWithAuth'
import { EnsureUser } from '@/app/EnsureUser'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CLAST - Code-Less API Sync Tool',
  description: 'A visual flow-based code generation tool for API integrations',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark:dark">
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <ConvexClientProviderWithAuth>
          <EnsureUser />
          <div className="relative flex min-h-screen flex-col">
            <SiteHeader />
            <div className="flex-1">
              <MDXClientWrapper>{children}</MDXClientWrapper>
            </div>
          </div>
        </ConvexClientProviderWithAuth>
      </body>
    </html>
  )
}
