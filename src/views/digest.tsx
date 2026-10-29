import type { DigestRow, NightDigest } from '../digest/types.js';

const RETRY_WARN_AT = 3;
const MISSING = '—';

function orMissing(value: string | null): string {
  return value === null || value === '' ? MISSING : value;
}

function DigestRowView({ row }: { row: DigestRow }) {
  const manyRetries = row.retries >= RETRY_WARN_AT;
  const failed = row.lastStatus === 'fail';
  return (
    <tr class={manyRetries || failed ? 'warn' : undefined}>
      <td>{row.job}</td>
      <td>{orMissing(row.owner)}</td>
      <td>{row.runs}</td>
      <td>{manyRetries ? `${row.retries} (many retries)` : row.retries}</td>
      <td>{failed ? 'fail (failed)' : row.lastStatus}</td>
      <td>{orMissing(row.lastError)}</td>
      <td>{orMissing(row.firstAt)}</td>
      <td>{orMissing(row.lastAt)}</td>
    </tr>
  );
}

export function DigestPage({ digest }: { digest: NightDigest }) {
  return (
    <>
      <h1>digest {digest.night}</h1>
      {digest.badLines > 0 && (
        <p class="warn">
          {digest.badLines} {digest.badLines === 1 ? 'line' : 'lines'} could not be read
        </p>
      )}
      {digest.rows.length === 0 ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>job</th>
              <th>owner</th>
              <th>runs</th>
              <th>retries</th>
              <th>last status</th>
              <th>last error</th>
              <th>first</th>
              <th>last</th>
            </tr>
          </thead>
          <tbody>
            {digest.rows.map((row) => (
              <DigestRowView row={row} />
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

export function DigestNotFound({ night }: { night: string }) {
  return (
    <>
      <h1>digest {night}</h1>
      <p class="warn">no run log for this night</p>
    </>
  );
}
