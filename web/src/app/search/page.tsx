import { searchItems, getFeeds } from '@/lib/api';
import { ArticleCard } from '@/components/article-card';
import type { FeedCategory } from '@/lib/types';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  if (!q || q.trim().length < 2) {
    return (
      <div className="animate-fade-in">
        <h2 className="text-xl font-semibold text-white mb-2">Search</h2>
        <p className="text-navy-400 text-sm">Enter at least 2 characters to search.</p>
      </div>
    );
  }

  let items, feeds;
  try {
    [items, feeds] = await Promise.all([
      searchItems(q, true),
      getFeeds(true),
    ]);
  } catch {
    return (
      <div className="animate-fade-in">
        <h2 className="text-xl font-semibold text-white mb-2">Search: {q}</h2>
        <p className="text-navy-400 text-sm">Error connecting to API.</p>
      </div>
    );
  }

  const feedMap = new Map(feeds.map((f) => [f.id, f]));

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">Search: {q}</h2>
        <p className="text-sm text-navy-400 mt-1">{items.length} results</p>
      </div>

      <div className="flex flex-col gap-2 stagger-children">
        {items.map((item, i) => {
          const feed = feedMap.get(item.feedId);
          return (
            <ArticleCard
              key={item.id}
              item={item}
              feedTitle={feed?.title}
              category={feed?.category as FeedCategory}
              index={i}
            />
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="p-12 rounded-xl border border-navy-700/50 bg-navy-900/40 text-center">
          <p className="text-navy-400 text-sm">No results found for "{q}"</p>
        </div>
      )}
    </div>
  );
}
