import { getHealth } from '@/lib/api';

export const revalidate = 60;

export default async function HealthPage() {
  let health;
  try {
    health = await getHealth(true);
  } catch {
    return (
      <div className="animate-fade-in">
        <h2 className="text-xl font-semibold text-white mb-2">Feed Health</h2>
        <p className="text-navy-400 text-sm">Cannot reach API.</p>
      </div>
    );
  }

  const statusColor = {
    healthy: 'text-accent-green',
    degraded: 'text-accent-amber',
    unhealthy: 'text-accent-red',
  }[health.status] || 'text-navy-400';

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">Feed Health</h2>
        <p className={`text-sm mt-1 font-medium ${statusColor}`}>
          {health.status.toUpperCase()} — {health.summary}
        </p>
      </div>

      <div className="space-y-1">
        {health.feeds.map((f) => (
          <div
            key={f.feedId}
            className="flex items-center justify-between px-4 py-3 rounded-lg border border-navy-700/50 bg-navy-900/40"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-2 h-2 rounded-full ${
                  f.isHealthy ? 'bg-accent-green' : 'bg-accent-red'
                }`}
              />
              <div>
                <span className="text-sm text-navy-100 font-medium">{f.title || f.feedId}</span>
                <span className="text-xs text-navy-500 ml-2">{f.category}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-navy-400">
              {f.avgLatencyMs > 0 && <span>{f.avgLatencyMs}ms</span>}
              {f.consecutiveFailures > 0 && (
                <span className="text-accent-red">{f.consecutiveFailures} failures</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {health.feeds.length === 0 && (
        <div className="p-12 rounded-xl border border-navy-700/50 bg-navy-900/40 text-center">
          <p className="text-navy-400 text-sm">No health data yet. Feeds are being fetched...</p>
        </div>
      )}
    </div>
  );
}
