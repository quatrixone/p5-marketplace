import test from 'node:test';
import assert from 'node:assert/strict';
import { validateStoreItem, indexEntry } from './storeItem.js';

const script = () => ({ kind: 'script', id: 'open-user-guide', name: 'Open', description: 'd', author: 'quatrixone', version: 1, console_type: 'ps5', script: 'home\nwait 1200' });

test('curated scripts and templates may carry a builtin_id', () => {
  assert.deepEqual(validateStoreItem({ ...script(), builtin_id: 'builtin:open-user-guide' }), []);
  assert.deepEqual(validateStoreItem({ ...script(), kind: 'homebrew', builtin_id: 'builtin:x' }).filter(e => e.includes('builtin_id')), ['builtin_id is only valid for curated scripts and templates']);
  assert.deepEqual(validateStoreItem({ ...script(), builtin_id: 'tpl-open-user-guide' }).filter(e => e.includes('builtin_id')), ['builtin_id is only valid for curated scripts and templates']);
});

test('notes are optional text and reach the item, not the index', () => {
  assert.deepEqual(validateStoreItem({ ...script(), notes: 'PS5 only.' }), []);
  assert.ok(validateStoreItem({ ...script(), notes: 'x'.repeat(2001) }).some(e => e.includes('notes')));
  assert.equal(indexEntry({ ...script(), builtin_id: 'builtin:open-user-guide' }, 'scripts/open-user-guide.json').builtin_id, 'builtin:open-user-guide');
  assert.equal(indexEntry(script(), 'scripts/open-user-guide.json').notes, undefined);
});
