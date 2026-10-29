import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

type Body = { night: string; rows: { job: string }[]; badLines: number };

const good = [
  '{"at":"2026-10-20T23:00:01+01:00","job":"b/job","status":"ok","owner":"rook"}',
  '{"at":"2026-10-20T23:05:01+01:00","job":"a/job","status":"fail","owner":null,"error":"boom"}',
].join('\n');

let runsDir: string;

beforeEach(() => {
  runsDir = mkdtempSync(join(tmpdir(), 'rig-routes-'));
  writeFileSync(join(runsDir, '2026-10-20.jsonl'), `${good}\n`);
  writeFileSync(join(runsDir, '2026-10-21.jsonl'), '');
  writeFileSync(join(runsDir, '2026-10-22.jsonl'), `${good}\nnot json at all\n{"at":"2026-10-22T0\n`);
});

afterEach(() => rmSync(runsDir, { recursive: true, force: true }));

function app() {
  return createApp({ adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir });
}

describe('digest routes', () => {
  it('answers 200 on both routes, with the same jobs in the same order', async () => {
    const page = await app().request('/digest/2026-10-20');
    const json = await app().request('/api/digest/2026-10-20');
    expect(page.status).toBe(200);
    expect(json.status).toBe(200);
    const body = (await json.json()) as Body;
    const html = await page.text();
    expect(body.rows.map((r) => r.job)).toEqual(['a/job', 'b/job']);
    expect(html.indexOf('a/job')).toBeGreaterThan(-1);
    expect(html.indexOf('a/job')).toBeLessThan(html.indexOf('b/job'));
  });

  it('answers 404 on both routes for a night with no file', async () => {
    expect((await app().request('/digest/2026-10-19')).status).toBe(404);
    expect((await app().request('/api/digest/2026-10-19')).status).toBe(404);
  });

  it('renders an empty night as "nothing ran" and as no rows', async () => {
    const page = await app().request('/digest/2026-10-21');
    expect(page.status).toBe(200);
    expect(await page.text()).toContain('nothing ran');
    const json = await app().request('/api/digest/2026-10-21');
    expect(json.status).toBe(200);
    expect((await json.json()) as Body).toMatchObject({ rows: [], badLines: 0 });
  });

  it('renders a night with bad lines and counts them', async () => {
    const page = await app().request('/digest/2026-10-22');
    expect(page.status).toBe(200);
    expect(await page.text()).toContain('2 lines could not be read');
    const body = (await (await app().request('/api/digest/2026-10-22')).json()) as Body;
    expect(body.badLines).toBe(2);
    expect(body.rows.map((r) => r.job)).toEqual(['a/job', 'b/job']);
  });
});
