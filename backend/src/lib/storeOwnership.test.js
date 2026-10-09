import test from 'node:test';
import assert from 'node:assert/strict';
import { assignSubmissionOwner } from './storeOwnership.js';
test('ownership comes from the GitHub event and survives account renames', () => {
  const item = assignSubmissionOwner({ id: 'my-app', author: 'Nick', owner: { github_id: 99 } }, null, { id: 7, login: 'author' });
  assert.equal(item.owner.github_id, 7);
  assert.equal(assignSubmissionOwner({ ...item, author: 'New nick' }, item, { id: 7, login: 'renamed' }).owner.github_login, 'renamed');
  assert.throws(() => assignSubmissionOwner({ ...item, owner: { github_id: 99 } }, item, { id: 99, login: 'attacker' }), /original/);
  assert.throws(() => assignSubmissionOwner({}, { id: 'curated' }, { id: 7, login: 'author' }), /maintainer/);
  assert.throws(() => assignSubmissionOwner({}, null, {}), /verified/);
});
