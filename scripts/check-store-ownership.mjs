import fs from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';

const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
const pr = event.pull_request;
if (!pr) throw new Error('This check requires a trusted pull_request event');
let authorId = pr.user.id;
if (pr.user.login === 'github-actions[bot]') {
  const issue = /^store\/issue-(\d+)$/.exec(pr.head.ref)?.[1];
  if (!issue || pr.head.repo.full_name !== event.repository.full_name) throw new Error('Untrusted submission branch');
  const r = await fetch(`https://api.github.com/repos/${event.repository.full_name}/issues/${issue}`, {
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${process.env.GH_TOKEN}` },
  });
  if (!r.ok) throw new Error('Could not verify the original issue author');
  const submitted = await r.json();
  if (!submitted.labels.some(l => l.name === 'store-accepted')) throw new Error('Submission is not accepted');
  authorId = submitted.user.id;
}
const base = pr.base.sha;
const head = process.env.STORE_HEAD || 'HEAD';
const files = execFileSync('git', ['diff', '--name-only', base, head, '--', 'store'], { encoding: 'utf8' }).trim().split('\n');
for (const file of files.filter(f => /^store\/(payloads|homebrew|scripts|templates)\/[a-z0-9-]+\.json$/.test(f))) {
  const prior = spawnSync('git', ['show', `${base}:${file}`], { encoding: 'utf8' });
  const old = prior.status === 0 ? JSON.parse(prior.stdout) : null;
  const next = spawnSync('git', ['show', `${head}:${file}`], { encoding: 'utf8' });
  const item = next.status === 0 ? JSON.parse(next.stdout) : null;
  if (old && old.owner?.github_id !== authorId) throw new Error(`${file}: only its original GitHub owner may change or delete it`);
  if (item && item.owner?.github_id !== authorId) throw new Error(`${file}: owner must match the verified submitting account`);
  if (old && item && old.owner.github_id !== item.owner.github_id) throw new Error(`${file}: ownership cannot be reassigned`);
}
console.log('Verified GitHub ownership for all changed catalog items');
