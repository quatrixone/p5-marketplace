import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodeCatalog } from '../backend/src/lib/catalogLinks.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = (...args) => execFileSync(process.execPath, [path.join(root, 'scripts/build-store-index.mjs'), ...args], { cwd: root, encoding: 'utf8' });
const manifest = (name) => decodeCatalog(JSON.parse(fs.readFileSync(path.join(root, 'store/builtin', name), 'utf8')));

// A curated item of this test's own, so the manifest stage is proved without
// depending on which items the catalog happens to carry.
const fixtureId = 'zz-manifest-fixture';
const fixtureFile = path.join(root, 'store/scripts', `${fixtureId}.json`);
function withFixture(body) {
  const source = JSON.parse(fs.readFileSync(path.join(root, 'store/scripts/home-ps5.json'), 'utf8'));
  fs.writeFileSync(fixtureFile, JSON.stringify({ ...source, id: fixtureId, builtin_id: `builtin:${fixtureId}` }, null, 2) + '\n');
  try {
    body();
  } finally {
    fs.rmSync(fixtureFile, { force: true });
    run();
  }
}

test('the build writes runtime manifests from the items that carry a builtin_id', () => {
  withFixture(() => {
    run();
    const entry = manifest('inputScripts.json').find(s => s.id === `builtin:${fixtureId}`);
    assert.ok(entry, 'the curated script is in the manifest');
    assert.equal(entry.store.id, fixtureId);
    assert.equal(entry.builtin_id, undefined, 'builtin_id becomes the manifest id, it is not repeated');
    assert.ok(Array.isArray(manifest('templates.json')));
    assert.doesNotThrow(() => run('--check'));
  });
});

test('--check fails when a manifest is stale', () => {
  const target = path.join(root, 'store/builtin/inputScripts.json');
  const good = fs.readFileSync(target, 'utf8');
  // Content that can never be the generated manifest, whichever items the
  // catalog carries - an empty list is the right answer when none are curated.
  fs.writeFileSync(target, JSON.stringify([{ id: 'builtin:not-a-real-item' }], null, 2) + '\n');
  try {
    assert.throws(() => run('--check'), /out of date/);
  } finally {
    fs.writeFileSync(target, good);
  }
});

test('two items claiming the same builtin_id fail the build', () => {
  withFixture(() => {
    const copy = path.join(root, 'store/scripts', 'zz-manifest-duplicate.json');
    const source = JSON.parse(fs.readFileSync(fixtureFile, 'utf8'));
    fs.writeFileSync(copy, JSON.stringify({ ...source, id: 'zz-manifest-duplicate' }, null, 2) + '\n');
    try {
      assert.throws(() => run(), /duplicate builtin_id/);
    } finally {
      fs.rmSync(copy, { force: true });
    }
  });
});

test('the payload manifest is a committed source file the build insists on', () => {
  const target = path.join(root, 'store/builtin/payloads.json');
  assert.ok(fs.existsSync(target), 'store/builtin/payloads.json is committed');
  const moved = `${target}.away`;
  fs.renameSync(target, moved);
  try {
    assert.throws(() => run(), /payloads\.json is missing/);
  } finally {
    fs.renameSync(moved, target);
    run();
  }
});
