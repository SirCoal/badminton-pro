'use client'

import './globals.css'
import { useState } from 'react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [lang, setLang] = useState<'en' | 'km'>('en')

  return (
    <html lang={lang}>
      <body className="flex min-h-screen flex-col">
        
        {/* Navbar */}
        <nav className="flex items-center justify-between bg-gray-900 px-6 py-4 text-white">
          <h1 className="text-xl font-bold">
            {lang === 'en' ? 'Badminton Booking' : 'កក់ទីលានប៊ិនតុន'}
          </h1>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setLang(lang === 'en' ? 'km' : 'en')}
              className="rounded bg-gray-700 px-3 py-1 text-sm"
            >
              {lang === 'en' ? 'KH' : 'EN'}
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">{children}</main>

        {/* Footer */}
        <footer className="bg-gray-100 py-4 text-center text-sm text-gray-600">
          {lang === 'en'
            ? '© 2026 Badminton Booking. All rights reserved.'
            : '© ២០២៦ កក់ទីលានប៊ិនតុន។ រក្សាសិទ្ធិគ្រប់យ៉ាង។'}
        </footer>
      </body>
    </html>
  )
}