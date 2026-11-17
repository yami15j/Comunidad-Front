import test from 'node:test';
import assert from 'node:assert/strict';
import { studentAccessSnapshot } from '../src/services/studentAccess.js';
import { libraryItems } from '../src/services/studentContent.js';

test('student snapshot separates live-only, content-only and full course permissions', () => {
  const courses = [
    { id: 'live', accessType: 'live', modules: [{ lessons: [{ resources: [{ id: 'secret' }] }] }] },
    { id: 'content', accessType: 'content' },
    { id: 'full', accessType: 'full' },
    { id: 'expired', accessType: 'full', accessExpiresAt: '2000-01-01T00:00:00Z' },
    { id: 'suspended', accessType: 'full', status: 'suspended' },
  ];
  const result = studentAccessSnapshot({ dashboard: { courses }, videos: courses.map(course => ({ id: course.id, courseId: course.id })), sessions: courses.map(course => ({ id: course.id, courseId: course.id })) });
  assert.deepEqual(result.courses.map(course => course.id), ['live', 'content', 'full']);
  assert.deepEqual(result.courses[0].modules, []);
  assert.deepEqual(result.videos.map(video => video.id), ['content', 'full']);
  assert.deepEqual(result.sessions.map(session => session.id), ['live', 'full']);
  assert.equal(libraryItems(courses.slice(0, 3), []).some(item => item.id === 'live' || item.id === 'secret'), false);
});
test('new permission snapshot removes content immediately after permission changes', () => {
  const input = { dashboard: { courses: [{ id: 'course', accessType: 'full', modules: [{ lessons: [] }] }] }, videos: [{ courseId: 'course' }], sessions: [{ courseId: 'course' }] };
  assert.equal(studentAccessSnapshot(input).videos.length, 1);
  input.dashboard.courses[0].accessType = 'live';
  const changed = studentAccessSnapshot(input);
  assert.equal(changed.videos.length, 0);
  assert.deepEqual(changed.courses[0].modules, []);
  input.dashboard.courses = [];
  assert.equal(studentAccessSnapshot(input).sessions.length, 0);
});
