import { getFeedItems } from '@/lib/api';
import { ArticleCard } from '@/components/article-card';
import type { FeedCategory } from '@/lib/types';
import { notFound } from 'next/navigation';

export const revalidate = 300;

export default async function FeedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let data;
  try {
    data = await getFeedItems(id, true);
  } catch {
    notFound();
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">{data.feed.title}</h2>
        <p className="text-sm text-navy-400 mt-1">{data.feed.url}</p>
      </div>

      <div className="flex flex-col gap-2 stagger-children">
        {data.items.map((item, i) => (
          <ArticleCard
            key={item.id}
            item={item}
            category={data.feed.category as FeedCategory}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
