import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const config = { adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir: 'runs' };

describe('GET /digest/:night', () => {
  it('renders the 2026-10-28 rows sorted by job with log times and markers', async () => {
    const res = await createApp(config).request('/digest/2026-10-28');
    const html = await res.text();
    expect(res.status).toBe(200);
    const jobs = ['digest/render', 'fixtures/refresh', 'lane/sync', 'notes/backup', 'rig/rotate-logs'];
    const positions = jobs.map((job) => html.indexOf(job));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(html).toContain('2026-10-29T01:30:00+01:00');
    expect(html).toContain('3 (many retries)');
    expect(html).toContain('fail (failed)');
    expect(html).toContain('quota exceeded');
    expect(html).toContain('1 line could not be read');
    expect(html).toContain('—');
  });

  it('returns 404 for a night with no file', async () => {
    const res = await createApp(config).request('/digest/2020-01-01');
    expect(res.status).toBe(404);
  });

  describe('with a temporary runs dir', () => {
    let dir: string;
    beforeEach(() => {
      dir = mkdtempSync(join(tmpdir(), 'rig-digest-page-'));
    });
    afterEach(() => rmSync(dir, { recursive: true, force: true }));

    it('says "nothing ran" for an empty file', async () => {
      writeFileSync(join(dir, '2026-10-30.jsonl'), '');
      const res = await createApp({ ...config, runsDir: dir }).request('/digest/2026-10-30');
      expect(res.status).toBe(200);
      expect(await res.text()).toContain('nothing ran');
    });
  });
});
