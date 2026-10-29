import { readdirSync } from 'node:fs';
import type { RigConfig } from './config.js';
import { countByLastStatus, type NightCounts } from './digest/counts.js';
import { readNight } from './digest/reader.js';
import { lastBeat, type Beat } from './heartbeat.js';

// `counts` is null when the night's file can't be read.
export type NightEntry = { night: string; counts: NightCounts | null };

export type Status = {
  adapter: string;
  installed: string;
  lastBeat: Beat | null;
  nights: NightEntry[];
};

// Nights on disk = runs/<YYYY-MM-DD>.jsonl, newest first.
export function nightsOnDisk(runsDir: string): string[] {
  try {
    return readdirSync(runsDir)
      .filter((f) => /^\d{4}-\d{2}-\d{2}\.jsonl$/.test(f))
      .map((f) => f.slice(0, 10))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

function nightEntry(runsDir: string, night: string): NightEntry {
  try {
    const digest = readNight(runsDir, night);
    return { night, counts: digest ? countByLastStatus(digest.rows) : null };
  } catch {
    return { night, counts: null };
  }
}

export function readStatus(config: RigConfig): Status {
  return {
    adapter: config.adapter,
    installed: config.installed,
    lastBeat: lastBeat(),
    nights: nightsOnDisk(config.runsDir).map((night) => nightEntry(config.runsDir, night)),
  };
}
