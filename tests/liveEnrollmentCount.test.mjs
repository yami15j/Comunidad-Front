import test from 'node:test';
import assert from 'node:assert/strict';
import { adaptLiveSession } from '../src/services/adapters.js';

test('live refresh retains the real enrollment count, including zero', () => {
  const session = { courseId: 'course', scheduledAt: '2099-01-01T15:00:00Z' };
  const initial = adaptLiveSession(session, [{ id: 'course', activeStudents: 3 }]);
  assert.equal(initial.attendeesCount, 3);
  assert.equal(adaptLiveSession(initial, [{ id: 'course', activeStudents: 3 }]).attendeesCount, 3);
  assert.equal(adaptLiveSession(initial, [{ id: 'course', activeStudents: 0 }]).attendeesCount, 0);
  assert.equal(adaptLiveSession(session, []).attendeesCount, null);
});
