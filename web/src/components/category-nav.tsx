'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CATEGORY_ICONS, CATEGORY_COLORS, type FeedCategory } from '@/lib/types';

const CATEGORIES: { id: FeedCategory; label: string }[] = [
  { id: 'indian-politics', label: 'Indian Politics' },
  { id: 'geopolitics', label: 'Geopolitics' },
  { id: 'ai-technology', label: 'AI & Tech' },
  { id: 'finance-economy', label: 'Finance' },
  { id: 'cybersecurity', label: 'Cybersecurity' },
];

export function CategoryNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      <Link
        href="/"
        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
          pathname === '/'
            ? 'bg-accent-blue/10 text-accent-blue'
            : 'text-navy-300 hover:text-navy-100 hover:bg-navy-800/60'
        }`}
      >
        <span className="text-base">📰</span>
        All Stories
      </Link>

      <div className="my-2 h-px bg-navy-700/50" />

      {CATEGORIES.map((cat) => {
        const isActive = pathname === `/category/${cat.id}`;
        return (
          <Link
            key={cat.id}
            href={`/category/${cat.id}`}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
              isActive
                ? CATEGORY_COLORS[cat.id].replace('border-', 'border-transparent ')
                : 'text-navy-300 hover:text-navy-100 hover:bg-navy-800/60'
            }`}
          >
            <span className="text-base">{CATEGORY_ICONS[cat.id]}</span>
            {cat.label}
          </Link>
        );
      })}

      <div className="my-2 h-px bg-navy-700/50" />

      <Link
        href="/health"
        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
          pathname === '/health'
            ? 'bg-accent-green/10 text-accent-green'
            : 'text-navy-400 hover:text-navy-200 hover:bg-navy-800/60'
        }`}
      >
        <span className="text-base">💚</span>
        Feed Health
      </Link>
    </nav>
  );
}
