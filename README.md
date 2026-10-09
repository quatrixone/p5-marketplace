# P5 Marketplace

Independent PS4 and PS5 catalog for [P5 Manager](https://github.com/quatrixone/p5-manager).
Payloads, homebrew, input scripts and Autoload templates are listed under `store/`.
Applications read the catalog from `main`; catalog updates do not require an app release.

Use **Marketplace → Publish** in P5 Manager to edit a draft and validate it before
opening a submission issue here. Choose either PS4 or PS5. Nickname is a display
name, not an identity. A maintainer reviews the issue and applies `store-accepted`;
the workflow prepares a PR, verifies file checksums and publishes after merge.
Files stay on their authors' release servers. Catalog URLs are encrypted using
AES-256-GCM; the public decoder does not make those download URLs secret.

Each item has an immutable `owner.github_id` assigned from the verified GitHub
issue author, never from submitted JSON. Only that account may update it. Account
renames and nickname changes do not transfer ownership. PR checks also enforce
ownership for direct PRs, including item deletion. Initial curated entries belong
to the account that uploaded this catalog; their `author` credits original projects.

## Validation

```sh
node scripts/build-store-index.mjs --check
node --test backend/src/lib/storeOwnership.test.js
```

Runtime contracts and catalog decoding are kept under `backend/src/lib/` to match
the app. `scripts/store-accept.mjs` requires `STORE_AUTHOR_ID` and
`STORE_AUTHOR_LOGIN` supplied by a trusted GitHub event.
