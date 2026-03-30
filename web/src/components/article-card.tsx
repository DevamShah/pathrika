'use client';

import { formatDistanceToNow } from 'date-fns';
import type { NormalizedItem, FeedCategory } from '@/lib/types';
import { CATEGORY_COLORS } from '@/lib/types';

interface ArticleCardProps {
  item: NormalizedItem;
  feedTitle?: string;
  category?: FeedCategory;
  index?: number;
}

export function ArticleCard({ item, feedTitle, category, index = 0 }: ArticleCardProps) {
  const colorClass = category ? CATEGORY_COLORS[category] : 'text-navy-300 bg-navy-700/50 border-navy-600';
  const timeAgo = formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true });

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block animate-fade-in"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex gap-4 p-4 rounded-xl border border-navy-700/50 bg-navy-900/40 hover:bg-navy-800/60 hover:border-navy-600/60 transition-all duration-200 ease-out">
        {/* Image */}
        {item.imageUrl && (
          <div className="hidden sm:block flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-navy-800">
            <img
              src={item.imageUrl}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-medium text-navy-50 leading-snug line-clamp-2 group-hover:text-white transition-colors">
            {item.title}
          </h3>

          {item.description && (
            <p className="mt-1.5 text-[13px] text-navy-300 leading-relaxed line-clamp-2">
              {item.description.replace(/<[^>]*>/g, '').slice(0, 200)}
            </p>
          )}

          <div className="mt-2.5 flex items-center gap-2 text-[11px]">
            {feedTitle && (
              <span className={`px-2 py-0.5 rounded-full border font-medium ${colorClass}`}>
                {feedTitle}
              </span>
            )}
            {item.author && (
              <span className="text-navy-400">{item.author}</span>
            )}
            <span className="text-navy-500">{timeAgo}</span>
          </div>
        </div>
      </div>
    </a>
  );
}
