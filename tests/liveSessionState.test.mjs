import test from 'node:test';
import assert from 'node:assert/strict';
import { liveSessionState, compareLiveSessions } from '../src/services/liveSessionState.js';
const session = { status: 'scheduled', scheduledAt: '2026-11-13T16:00:00Z', durationMinutes: 60 };
test('live card state changes at the scheduled start and end', () => {
  assert.equal(liveSessionState(session, Date.parse('2026-11-13T15:59:59Z')).effectiveStatus, 'scheduled');
  assert.equal(liveSessionState(session, Date.parse('2026-11-13T16:00:00Z')).isLiveNow, true);
  assert.equal(liveSessionState(session, Date.parse('2026-11-13T17:00:00Z')).effectiveStatus, 'ended');
});
test('explicitly ended classes never display a live badge', () => {
  assert.equal(liveSessionState({ ...session, status: 'ended' }, Date.parse('2026-11-13T16:15:00Z')).isLiveNow, false);
});

test('live sessions sort before upcoming and ended sessions', () => {
  const rows = [
    { id: 'old', effectiveStatus: 'ended', scheduledAt: '2026-11-01T10:00:00Z' },
    { id: 'future', effectiveStatus: 'scheduled', scheduledAt: '2026-11-14T10:00:00Z' },
    { id: 'recent', effectiveStatus: 'ended', scheduledAt: '2026-11-12T10:00:00Z' },
    { id: 'live', effectiveStatus: 'live', scheduledAt: '2026-11-13T10:00:00Z' },
  ];
  assert.deepEqual(rows.sort(compareLiveSessions).map(row => row.id), ['live','future','recent','old']);
});
