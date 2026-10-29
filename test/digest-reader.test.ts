import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/reader.js';

describe('readNight on runs/2026-10-28.jsonl', () => {
  const digest = readNight('runs', '2026-10-28');

  it('returns 5 jobs sorted by job and counts the truncated line', () => {
    expect(digest?.badLines).toBe(1);
    expect(digest?.rows.map((row) => row.job)).toEqual([
      'digest/render',
      'fixtures/refresh',
      'lane/sync',
      'notes/backup',
      'rig/rotate-logs',
    ]);
  });

  it('counts runs and retries and keeps the log offset', () => {
    const refresh = digest?.rows.find((row) => row.job === 'fixtures/refresh');
    expect(refresh).toEqual({
      job: 'fixtures/refresh',
      owner: 'rook',
      runs: 4,
      retries: 3,
      lastStatus: 'ok',
      lastError: null,
      firstAt: '2026-10-29T01:30:00+01:00',
      lastAt: '2026-10-29T01:37:00+01:00',
    });
    const backup = digest?.rows.find((row) => row.job === 'notes/backup');
    expect(backup?.lastStatus).toBe('fail');
    expect(backup?.lastError).toBe('quota exceeded');
  });
});

describe('readNight edge cases', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'rig-reader-'));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('returns null when the night has no file', () => {
    expect(readNight(dir, '2026-01-01')).toBeNull();
  });

  it('returns no rows for an empty file', () => {
    writeFileSync(join(dir, '2026-01-02.jsonl'), '');
    expect(readNight(dir, '2026-01-02')).toEqual({ night: '2026-01-02', rows: [], badLines: 0 });
  });

  it('keeps a row whose owner is null', () => {
    writeFileSync(
      join(dir, '2026-01-03.jsonl'),
      '{"at":"2026-01-03T05:00:00+01:00","job":"a","status":"ok","owner":null}\n' +
        '{"at":"2026-01-03T05:01:00+01:00","status":"ok","owner":null}\n',
    );
    const digest = readNight(dir, '2026-01-03');
    expect(digest?.rows).toHaveLength(1);
    expect(digest?.rows[0]?.owner).toBeNull();
    expect(digest?.badLines).toBe(1);
  });

  it('rejects a night that is not YYYY-MM-DD', () => {
    writeFileSync(join(dir, 'secret.jsonl'), '{"at":"2026-01-03T05:00:00Z","job":"a","status":"ok"}\n');
    const nested = join(dir, 'nested');
    expect(readNight(nested, '../secret')).toBeNull();
    expect(readNight(dir, '2026-13-40')).toBeNull();
  });
});
