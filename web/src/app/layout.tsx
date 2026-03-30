import type { Metadata } from 'next';
import './globals.css';
import { CategoryNav } from '@/components/category-nav';
import { SearchBar } from '@/components/search-bar';

export const metadata: Metadata = {
  title: 'Pathrika — RSS Intelligence',
  description: 'Personal news aggregator across Indian Politics, Geopolitics, AI, Finance & Cybersecurity',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="fixed left-0 top-0 bottom-0 w-56 bg-navy-900 border-r border-navy-700/40 flex flex-col z-10">
            {/* Logo */}
            <div className="p-4 pb-3">
              <h1 className="text-lg font-semibold text-white tracking-tight">
                Pathrika
              </h1>
              <p className="text-[11px] text-navy-500 mt-0.5">RSS Intelligence</p>
            </div>

            {/* Search */}
            <div className="px-3 pb-3">
              <SearchBar />
            </div>

            {/* Nav */}
            <div className="flex-1 px-2 overflow-y-auto">
              <CategoryNav />
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-navy-700/40">
              <p className="text-[10px] text-navy-600 text-center">
                25 feeds · 5 categories
              </p>
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1 ml-56">
            <div className="max-w-3xl mx-auto px-6 py-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
