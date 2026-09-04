# Dependency resolutions

Decisions that `package.json` cannot explain on its own. Add, update or remove an entry in the
same change as the resolution it describes.

## `axios` — `^1.16.0`

**Why:** four consumers request axios on incompatible lines — this workspace declares `0.24.0`
directly, `@eyeseetea/d2-api@1.20.0` requests `1.6.4`, `@eyeseetea/feedback-component@0.2.0`
requests `^0.27.2`, and `wait-on@5.3.0` requests `^0.21.1`. Without a resolution the tree installs
four separate axios versions, every one of them behind the advisory floor. Upgrading the direct
dependency alone does not move the three transitive paths.

**Fixes:** GHSA-hfxv-24rg-xrqf, GHSA-777c-7fjr-54vf, GHSA-p92q-9vqr-4j8v, GHSA-j5f8-grm9-p9fc,
GHSA-35jp-ww65-95wh (all `<1.16.0`), plus the `<1.15.1` and `<1.15.2` sets.

**Drop when:** `d2-api`, `feedback-component` and `wait-on` all request axios `>=1.16.0`, and
`yarn why axios -R` shows a single resolved version after removing this entry and forcing
re-resolution.

**Note on form:** written as a floor (`^1.16.0`), not a fixture (`1.16.0`). The previous entry was
the exact pin `1.13.5`, which was itself the cause of ten open high findings by the time it was
read — see open decision A.7.
