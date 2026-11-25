# Dependency resolutions and accepted findings

Every entry in the `resolutions` block of `package.json` is documented here, together with the findings that are accepted because no usable fix exists. Review this file whenever dependencies are updated.

## Resolutions

### `axios` → `^1.20.0`

- **Why:** `@eyeseetea/d2-api` and the app code use axios 1.x APIs, while `package.json` still lists `axios@0.24.0`. The resolution forces a single 1.x copy in the tree.
- **Fixes:** all axios advisories up to and including those affecting `<1.20.0` (prototype-pollution gadgets, proxy/`NO_PROXY` bypasses, HTTP/2 adapter, `formDataToJSON` recursion).
- **Drop when:** the direct `axios` dependency is moved to `^1.20.0` and `@eyeseetea/d2-api` depends on a patched range by itself.

### `lodash` → `^4.18.0`

- **Why:** the direct dependency is also pinned to `4.18.0`; the resolution makes transitive copies follow it.
- **Fixes:** code injection via `_.template` imports and prototype pollution (`<=4.17.23`).
- **Drop when:** no transitive package requests a lodash range that resolves below 4.18.0.

### `qs` → `^6.16.1`

- **Why:** `@eyeseetea/d2-api` requests a vulnerable `qs`.
- **Fixes:** the `qs` DoS advisories (`isBuffer`, `stringify` with `arrayFormat: comma`, array-limit bypass) affecting `<=6.16.0`.
- **Drop when:** `@eyeseetea/d2-api` ships a patched range.

### `glob-parent` → `5.1.2`, `node-fetch` → `2.6.7`, `@types/react` → `17.0.88`, `@types/react-dom` → `17.0.25`

- Unchanged from before this round. They are compatibility pins and an earlier vulnerability fix. Re-evaluate each one separately; they were not reviewed here.

### `moment@npm:2.29.4` → `^2.31.0`

- **Why:** `@eyeseetea/d2-ui-components` pins `moment` exactly to `2.29.4`.
- **Fixes:** moment path traversal via crafted non-string locale (`>=2.29.2 <2.31.0`).
- **Drop when:** `@eyeseetea/d2-ui-components` depends on `moment >=2.31.0`.

### `linkify-it` → `^5.0.2`

- **Why:** `react-linkify@1.0.0-alpha` (via `@eyeseetea/d2-ui-components`) depends on `linkify-it@^2.0.3`.
- **Fixes:** two quadratic-complexity DoS advisories (`<=5.0.1`).
- **Floor chosen on purpose:** `6.x` is also patched but its CommonJS export has no default constructor and `react-linkify` fails with `_linkifyIt2.default is not a constructor`. `5.0.2` loads and matches URLs and e-mails correctly.
- **Drop when:** `@eyeseetea/d2-ui-components` replaces or updates `react-linkify`.

### `node-gettext` → `^3.0.1`

- **Why:** `i18next-conv@6` (via `@dhis2/d2-i18n-extract` and `@dhis2/d2-i18n-generate`) depends on `node-gettext@^2`.
- **Fixes:** prototype pollution (`<=3.0.0`).
- **Scope:** build-time tooling only (`yarn localize`). `yarn localize` was run after the change and generated the same translation files.
- **Drop when:** the DHIS2 i18n tooling updates `i18next-conv`.

### `loader-utils@npm:1.2.3` → `^1.4.2`

- **Why:** `styled-jsx@4.0.1` pins `loader-utils` exactly to `1.2.3`. `styled-jsx` itself cannot be removed or bumped: `@dhis2/ui` (`header-bar`) imports `styled-jsx/style` at runtime.
- **Fixes:** prototype pollution and ReDoS (`<1.4.2`).
- **Why it is safe:** same major version; `loader-utils` is only used by the styled-jsx webpack loader, which this Vite build does not use.
- **Drop when:** `@dhis2/ui` moves to a `styled-jsx` release that no longer pins `loader-utils`.

## Toolchain changes (not resolutions)

- `vite` 4 → 7, `@vitejs/plugin-react` 4 → 5, `vitest` 0.34 → 4, `jsdom` 21 → 26: fixes the critical `vitest` and `tinypool` advisories and the `vite`/`esbuild`/`ws` advisories. `vitest` 5 was not used: it only needs Node 22.12+ (`.nvmrc` is 22.22.0), but 4.x already fixes the advisories with a smaller jump and also runs on Node 20.
- `vite-plugin-node-stdlib-browser` declares `vite ^2 || ^3 || ^4` as a peer dependency. It works with Vite 7 (dev server, tests and build verified) but Yarn reports a peer warning.
- `@testing-library/jest-dom` 5.14.1 → 5.17.0: drops the `css` → `source-map-resolve` → `decode-uri-component` chain.
- `@babel/core` 7.15.8 → 7.29.13, `http-proxy-middleware` 2.0.1 → 2.0.12.
- `node-gyp` re-resolved to 13.1.0 (requires Node `^22.22.2`) so that `cacache` uses `glob@14`. It is only reachable through `node-stdlib-browser` → `crypto-browserify` and is never executed here. `.nvmrc` is 22.22.0, below that engine range; the mismatch is harmless because no native module is built.

## Accepted findings

### `elliptic@6.6.1` (low, GHSA-848j-6mx2-7j84)

- **No fix:** 6.6.1 is the latest published version and the advisory covers `<=6.6.1`.
- **Path:** `node-stdlib-browser` → `crypto-browserify` → `browserify-sign` / `create-ecdh`.
- **Impact:** only reachable from the Node polyfills of the browser bundle; the app does not use elliptic-curve signing.
- **Review when:** a patched `elliptic` is published, or `node-stdlib-browser` drops `crypto-browserify`.

### `i18next@10.6.0` (moderate, GHSA-6jcc-5g8w-32mx)

- **Fix exists but is not applied:** the patched range is `>=26.3.4`; `@dhis2/d2-i18n` requires `^10.3`. Forcing a 10 → 26 major jump at runtime could not be validated without a DHIS2 instance.
- **Impact:** `deepExtend` prototype corruption needs attacker-controlled resource bundles; the app only loads its own bundled translations.
- **Review when:** `@dhis2/d2-i18n` updates `i18next`, or a DHIS2 instance is available to validate the major bump.

### `picomatch@2.3.2`, `4.0.4`, `4.0.7` (high, GHSA-fc5q-39xc-vjpf)

- **No fix:** 4.0.7 is the latest published version and the advisory covers every version through it.
- **Paths:** `2.3.2` through `micromatch` ← `fast-glob` ← `globby` ← `@typescript-eslint/typescript-estree`; `4.0.4` through `vite` and `jest-util`/`jest-message-util` (types of `@testing-library/jest-dom`); `4.0.7` through `tinyglobby` ← `vite`.
- **Impact:** the ReDoS needs an attacker-supplied glob pattern. All of them are dev tooling (lint, Vite, test types) fed with the repository's own patterns, and none ships in the app bundle.
- **Dependency-Track counts instances, not versions:** GitHub numbers alerts of the same advisory by order of appearance, so a third `picomatch` version shows up as one new high against a base that has two. `yarn dedupe picomatch` moves `4.0.4` onto `4.0.7` (every parent range accepts it), leaving `2.3.2` and `4.0.7`, the same count as the base. No pin is needed; re-run `yarn dedupe picomatch` if a new `picomatch` 4.x release lands in the lockfile.
- **Review when:** a patched `picomatch` is published.

### `braces@3.0.3` (high, GHSA-vfj7-8cjw-p6xm)

- **No fix:** 3.0.3 is the latest published version and the advisory covers `<=3.0.3`.
- **Paths:** `micromatch` ← `fast-glob` ← `globby` ← `@typescript-eslint/typescript-estree`, and `micromatch` ← `http-proxy-middleware`.
- **Impact:** the stack overflow needs an attacker-supplied brace pattern; both consumers only receive the repository's own patterns. Dev tooling only.
- **Review when:** a patched `braces` is published, or ESLint and `@typescript-eslint` are migrated.

### `deepmerge@4.3.1` (medium, GHSA-gcqx-w48m-w2h4) and `sprintf-js@1.0.3` (medium, GHSA-hp3w-g68c-fv3c)

- **No fix:** `deepmerge` 4.3.1 and `sprintf-js` 1.1.3 are the latest published versions and are inside the advisory ranges.
- **Paths:** `deepmerge` through `i18next-scanner` and `sprintf-js` through `argparse`, both from the archived `@dhis2/d2-i18n-extract` / `@dhis2/d2-i18n-generate`.
- **Impact:** build-time translation extraction only (`yarn localize`); they process the repository's own sources and are not in the app bundle.
- **Review when:** the i18n tooling is replaced. `dhis2-app-skeleton` moved to `@dhis2/cli-app-scripts`, which removes these two but brings `request` and `uuid@3.4.0`; that migration is a separate decision.

### Findings that were already open on the base branch

- `eslint@8.1.0` (medium, GHSA-p5wg-g6qr-c7cg): fixed in ESLint 9.26+, a major migration of the lint setup that is not part of this PR.
- `react-router@6.0.0-beta.0` (two medium, GHSA-wrjc-x8rr-h8h6 and GHSA-9jcx-v3wj-wh4m): `react-router` and `react-router-dom` are direct dependencies pinned to this beta, and moving off it is an app migration, not a dependency refresh.
