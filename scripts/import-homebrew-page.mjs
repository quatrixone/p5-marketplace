// Import metadata, not binaries. Checksums come from the source's reviewed feed.
import fs from 'node:fs';
import path from 'node:path';
import { encodeCatalog, decodeCatalog } from '../backend/src/lib/catalogLinks.js';
import { validateStoreItem } from '../backend/src/lib/storeItem.js';
const url = 'https://homebrew.page/catalog/v1.json';
const feed = process.argv[2] ? JSON.parse(fs.readFileSync(process.argv[2], 'utf8')) : await (await fetch(url, { signal: AbortSignal.timeout(30000) })).json();
if (feed.schema !== 1 || !Array.isArray(feed.apps) || !Array.isArray(feed.coming_soon)) throw new Error('Unsupported upstream catalog');
fs.mkdirSync('store/homebrew', { recursive: true });
const seen = new Set();
for (const app of [...feed.apps, ...feed.coming_soon]) {
  if (!/^PPSA\d{5}$/.test(app.titleid) || seen.has(app.titleid)) throw new Error('Invalid or duplicate upstream title ID');
  seen.add(app.titleid);
  const comingSoon = !app.artifact_url;
  const item = {
    kind: 'homebrew', id: `hb-${app.titleid.toLowerCase()}`, title_id: app.titleid,
    name: app.name, description: app.description, author: app.author,
    version: 1, console_type: 'ps5', owner: { github_id: 57962558, github_login: 'quatrixone' },
    ...(app.version ? { app_version: app.version } : {}),
    ...(app.license ? { license: app.license } : {}),
    homepage: app.source_repo || app.page,
    source: { catalog: url, commit: feed.source.commit, page: app.page },
    ...(comingSoon ? { comingSoon: true } : {}),
    files: comingSoon ? [] : [{ type: app.format, name: `${app.titleid}.${app.format}`, url: app.artifact_url, sha256: app.sha256 }],
  };
  const file = path.join('store/homebrew', `${item.id}.json`);
  if (fs.existsSync(file)) {
    const old = decodeCatalog(JSON.parse(fs.readFileSync(file, 'utf8')));
    if (old.source?.catalog !== url) throw new Error(`${item.id}: refusing to replace an unrelated item`);
    item.owner = old.owner;
    const equal = JSON.stringify({ ...old, version: 0 }) === JSON.stringify({ ...item, version: 0 });
    item.version = equal ? old.version : old.version + 1;
  }
  const errors = validateStoreItem(item);
  if (errors.length) throw new Error(`${app.name}: ${errors.join('; ')}`);
  fs.writeFileSync(file, JSON.stringify(encodeCatalog(item), null, 2) + '\n');
}
console.log(`Imported ${feed.apps.length} PS5 releases and ${feed.coming_soon.length} coming-soon entries from homebrew.page`);
