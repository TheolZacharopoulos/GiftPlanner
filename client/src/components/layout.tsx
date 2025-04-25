import React from 'react'
import { Link } from 'wouter'
import { ThemeToggle } from '@/components/theme-toggle'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-white font-bold text-xl">G</div>
            <h1 className="text-xl font-bold text-primary dark:text-primary">FOMO's GiftGroup</h1>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} FOMO's GiftGroup. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
