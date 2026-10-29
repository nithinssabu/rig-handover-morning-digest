export type RunStatus = 'ok' | 'retry' | 'fail';

// One row per job in a night's run log. `runs` counts every parsed line for the job and
// `retries` the lines with status `retry`. Times keep the offset from the log.
export type DigestRow = {
  job: string;
  owner: string | null;
  runs: number;
  retries: number;
  lastStatus: RunStatus;
  lastError: string | null;
  firstAt: string;
  lastAt: string;
};

export type NightDigest = {
  night: string;
  rows: DigestRow[];
  badLines: number;
};

// The signature of `readNight`, implemented in `src/digest/reader.ts`.
// `null` when there is no `<runsDir>/<night>.jsonl`. A line that doesn't parse is counted in
// `badLines`, never thrown. Rows are sorted by job.
export type ReadNight = (runsDir: string, night: string) => NightDigest | null;
