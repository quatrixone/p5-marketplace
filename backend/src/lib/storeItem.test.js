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

test('the index carries what the app matches on: checksum, icon, title id and owner', () => {
  const payload = { kind: 'payload', id: 'kstuff', name: 'kstuff', description: 'd', author: 'me', version: 1, console_type: 'ps5',
    icon: 'https://example.org/i.png', owner: { github_id: 7, github_login: 'me' },
    files: [{ type: 'bin', url: 'https://example.org/kstuff.bin', sha256: 'b'.repeat(64), size: 10 }] };
  const entry = indexEntry(payload, 'payloads/kstuff.json');
  // A renamed copy in the user's library is recognised by its checksum.
  assert.equal(entry.sha256, 'b'.repeat(64));
  assert.equal(entry.icon, 'https://example.org/i.png');
  assert.deepEqual(entry.owner, { github_id: 7, github_login: 'me' });
  // Two files have no single checksum to match on.
  const two = indexEntry({ ...payload, files: [payload.files[0], { ...payload.files[0], url: 'https://example.org/b.bin' }] }, 'payloads/kstuff.json');
  assert.equal(two.sha256, undefined);
  // The app looks for a title id under either name.
  const hb = indexEntry({ ...payload, kind: 'homebrew', title_id: 'PPSA99997', files: [{ type: 'zip', url: 'https://example.org/PPSA99997.zip', sha256: 'c'.repeat(64) }] }, 'homebrew/x.json');
  assert.equal(hb.title_id, 'PPSA99997');
  assert.equal(hb.homebrew_id, 'PPSA99997');
});
