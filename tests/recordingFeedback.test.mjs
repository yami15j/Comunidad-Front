import test from 'node:test';
import assert from 'node:assert/strict';
import { recordingErrorMessage } from '../src/services/recordingFeedback.js';

test('missing Vimeo migration explains failure without claiming a save', () => {
  const message = recordingErrorMessage(new Error("Could not find the 'external_url' column of 'videos' in the schema cache"));
  assert.match(message, /base de datos/);
  assert.match(message, /Tus datos siguen/);
  assert.doesNotMatch(message, /schema cache|correctamente/);
});
test('other publication errors retain their useful explanation', () => {
  assert.equal(recordingErrorMessage(new Error('Sin acceso al curso')), 'Sin acceso al curso');
  assert.match(recordingErrorMessage({}), /No pudimos guardar/);
});
