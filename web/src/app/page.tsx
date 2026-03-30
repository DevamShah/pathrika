import { getAllItems, getFeeds } from '@/lib/api';
import { ArticleCard } from '@/components/article-card';
import type { FeedCategory } from '@/lib/types';

export const revalidate = 300;

export default async function HomePage() {
  let items, feeds;
  try {
    [items, feeds] = await Promise.all([
      getAllItems(60, 0, true),
      getFeeds(true),
    ]);
  } catch {
    return (
      <div className="animate-fade-in">
        <h2 className="text-xl font-semibold text-white mb-2">All Stories</h2>
        <div className="p-8 rounded-xl border border-navy-700/50 bg-navy-900/40 text-center">
          <p className="text-navy-400 text-sm">
            Connecting to API... Make sure the backend is running.
          </p>
          <p className="text-navy-500 text-xs mt-2">
            Run: docker-compose up
          </p>
        </div>
      </div>
    );
  }

  const feedMap = new Map(feeds.map((f) => [f.id, f]));

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">All Stories</h2>
        <p className="text-sm text-navy-400 mt-1">Latest from all 25 feeds</p>
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
          <p className="text-navy-400 text-sm">No articles yet. Feeds are being fetched...</p>
          <p className="text-navy-500 text-xs mt-2">First fetch takes ~30 seconds for all 25 feeds</p>
        </div>
      )}
    </div>
  );
}
