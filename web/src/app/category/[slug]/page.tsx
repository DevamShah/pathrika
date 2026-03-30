import { getCategoryItems, getFeeds } from '@/lib/api';
import { ArticleCard } from '@/components/article-card';
import { CATEGORY_ICONS, type FeedCategory } from '@/lib/types';
import { notFound } from 'next/navigation';

export const revalidate = 300;

const VALID_CATEGORIES = [
  'indian-politics',
  'geopolitics',
  'ai-technology',
  'finance-economy',
  'cybersecurity',
];

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!VALID_CATEGORIES.includes(slug)) {
    notFound();
  }

  let data, feeds;
  try {
    [data, feeds] = await Promise.all([
      getCategoryItems(slug, 60, 0, true),
      getFeeds(true),
    ]);
  } catch {
    return (
      <div className="animate-fade-in">
        <h2 className="text-xl font-semibold text-white mb-2">Loading...</h2>
        <p className="text-navy-400 text-sm">Connecting to API...</p>
      </div>
    );
  }

  const feedMap = new Map(feeds.map((f) => [f.id, f]));
  const icon = CATEGORY_ICONS[slug as FeedCategory];
  const feedsInCategory = feeds.filter((f) => f.category === slug);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">
          {icon} {data.category.label}
        </h2>
        <p className="text-sm text-navy-400 mt-1">
          {feedsInCategory.map((f) => f.title).join(' · ')}
        </p>
      </div>

      <div className="flex flex-col gap-2 stagger-children">
        {data.items.map((item, i) => {
          const feed = feedMap.get(item.feedId);
          return (
            <ArticleCard
              key={item.id}
              item={item}
              feedTitle={feed?.title}
              category={slug as FeedCategory}
              index={i}
            />
          );
        })}
      </div>

      {data.items.length === 0 && (
        <div className="p-12 rounded-xl border border-navy-700/50 bg-navy-900/40 text-center">
          <p className="text-navy-400 text-sm">No articles yet for this category.</p>
        </div>
      )}
    </div>
  );
}
