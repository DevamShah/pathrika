import cron from 'node-cron';
import { refreshAllFeeds } from './feed-router.js';
import pino from 'pino';

const log = pino({ name: 'scheduler' });

const INTERVAL = process.env.FETCH_INTERVAL_MS
  ? parseInt(process.env.FETCH_INTERVAL_MS, 10)
  : 600_000; // 10 minutes default

let running = false;

async function tick() {
  if (running) {
    log.warn('Previous refresh still running, skipping');
    return;
  }
  running = true;
  try {
    const result = await refreshAllFeeds();
    log.info(result, 'Scheduled refresh done');
  } catch (err) {
    log.error({ err }, 'Scheduled refresh error');
  } finally {
    running = false;
  }
}

export function startScheduler(): void {
  log.info({ intervalMs: INTERVAL }, 'Starting feed scheduler');

  // Initial fetch on startup
  tick();

  // Then every 10 minutes
  cron.schedule('*/10 * * * *', () => {
    tick();
  });
}
