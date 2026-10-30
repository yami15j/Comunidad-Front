import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_VIDEO_BYTES, uploadVideoFile } from '../src/services/videoUpload.js';
const file = { size: 100, type: 'video/mp4' };
test('video upload sends bytes before successful completion and reports actual storage failures', async () => {
  let sent;
  await uploadVideoFile('https://storage.test/signed', file, undefined, async (url, options) => {
    sent = options;
    return new Response('{}');
  });
  assert.equal(sent.body, file);
  assert.equal(sent.method, 'PUT');
  await assert.rejects(uploadVideoFile('', { ...file, size: MAX_VIDEO_BYTES + 1 }), /2 GB/);
  for (const [status, message, expected] of [
    [400, 'The object exceeded the maximum allowed size', /tamaño permitido/],
    [413, '', /tamaño permitido/], [507, '', /espacio/],
    [403, '', /permiso temporal/], [400, 'mime type not supported', /formato/],
  ]) {
    await assert.rejects(uploadVideoFile('', file, undefined, async () =>
      new Response(JSON.stringify({ message }), { status })), expected);
  }
  await assert.rejects(uploadVideoFile('', file, undefined, async () => { throw new TypeError('fetch failed'); }), /conexión/);
  const aborted = new DOMException('cancelled', 'AbortError');
  await assert.rejects(uploadVideoFile('', file, undefined, async () => { throw aborted; }), { name: 'AbortError' });
});
