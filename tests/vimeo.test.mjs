import test from 'node:test';
import assert from 'node:assert/strict';
import { isVimeoPlayer } from '../src/services/videoSource.js';
test('only canonical HTTPS Vimeo players use the embedded iframe', () => {
 assert.equal(isVimeoPlayer('https://player.vimeo.com/video/1240033628?h=d4ff966bc1'),true);
 for (const url of ['https://vimeo.com/1240033628', 'https://player.vimeo.com.evil.test/video/123', 'javascript:alert(1)', 'https://storage.example/video.mp4']) assert.equal(isVimeoPlayer(url),false);
});
