import { describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../src/app.js';

const config = { adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir: 'runs' };

describe('status board', () => {
  it('shows the lane banner and the nights on disk', async () => {
    process.env.LANE_MARKER = 'TEST-MARKER';
    const res = await createApp(config).request('/');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('TEST-MARKER');
    expect(html).toContain('2026-10-28');
  });

  it('links each night to its digest with ok / retry / fail counts', async () => {
    const html = await (await createApp(config).request('/')).text();
    const expected = {
      '2026-10-27': 'ok 4 · retry 0 · fail 0',
      '2026-10-28': 'ok 4 · retry 0 · fail 1',
    };
    for (const [night, counts] of Object.entries(expected)) {
      expect(html).toContain(`<a href="/digest/${night}">${night}</a>`);
      expect(html).toContain(counts);
    }
  });

  it('shows — for a night whose file cannot be read', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'rig-'));
    mkdirSync(join(dir, '2026-10-26.jsonl'));
    const html = await (await createApp({ ...config, runsDir: dir }).request('/')).text();
    expect(html).toContain('<a href="/digest/2026-10-26">2026-10-26</a>');
    expect(html).toContain('—');
  });

  it('health answers with the lane id', async () => {
    const res = await createApp(config).request('/health');
    expect(await res.json()).toEqual({ ok: true, lane: 'lane-07' });
  });
});
