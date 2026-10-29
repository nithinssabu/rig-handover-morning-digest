import type { DigestRow, RunStatus } from './types.js';

export type NightCounts = Record<RunStatus, number>;

// Jobs in a night by their last status: each row counts once, under `lastStatus`.
export function countByLastStatus(rows: DigestRow[]): NightCounts {
  const counts: NightCounts = { ok: 0, retry: 0, fail: 0 };
  for (const row of rows) counts[row.lastStatus] += 1;
  return counts;
}
