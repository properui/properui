# Visual regression baseline

`tests/visual/baseline/` is a committed set of WebP screenshots — a curated ~25-route sample of
the docs site (see `tests/visual/routes.ts`) at two viewports (1280x800 desktop, 390x844 mobile),
in light and dark, plus a handful of `dir="rtl"` passes. 114 images total. `scripts/visual-check.ts`
re-captures the same routes and diffs each against its baseline with pixelmatch; `pnpm visual:check`
fails if any capture exceeds `DIFF_THRESHOLD_PCT` (see `tests/visual/routes.ts`), if a baseline is
missing, or if a capture's dimensions don't match.

## The baseline is Linux-only

**The baseline must be (re)captured inside a Linux container that matches the CI runner — never on
a host machine directly, even Linux ones with different font packages, and never on macOS.** Font
rasterisation differs enough between platforms that a macOS-captured baseline diffed against a
Linux capture in CI produced 2.8-9.42% "differing pixels" on **every single one of the 106
images**, with 6 exceeding the old 8% threshold and failing the build — despite nothing having
actually changed. Chasing that kind of noise a route at a time is a waste of time; the fix is to
capture and check on the same platform, always.

Because of this, `DIFF_THRESHOLD_PCT` is deliberately tight (currently 1%, see the comment in
`tests/visual/routes.ts`) — same-platform Linux-vs-Linux reruns of the full 114-image set measured
**0.00% differing pixels** with no exceptions. A real regression should read far above that.

`pnpm visual:check` still works on any platform for a quick local sanity check while iterating, but
treat a diff there as inconclusive noise unless it's egregious — CI (Linux) is the source of truth,
and the baseline must be regenerated on Linux, not adjusted to make a macOS run pass.

## Regenerating the baseline

Do this whenever a route's real content or layout changes on purpose. Run it from the repo root,
with Docker available:

```sh
# 1. Check the installed Playwright version and match the container tag to it.
node -e "console.log(require('playwright/package.json').version)"

# 2. Build the docs site on the host (fonts don't affect the build step, only the screenshot step).
pnpm exec turbo run build --filter=docs...

# 3. Pull the official Playwright image for that version, matching the CI runner's Ubuntu release
#    (check https://github.com/actions/runner-images for what ubuntu-latest currently points at;
#    it moved to 24.04 "noble" in 2025 — use mcr.microsoft.com/playwright:v<VERSION>-jammy if only
#    that tag exists for your version).
docker pull mcr.microsoft.com/playwright:v<VERSION>-noble

# 4. Run the capture inside the container against the host-built site. The simplest reliable way
#    is to copy the repo into the container's own filesystem (not a bind mount) so native
#    dependencies (sharp, Playwright's browser binaries) install as Linux binaries rather than
#    reusing whatever the host installed:
docker run -d --name visual-baseline-cap -v "$(pwd)":/work -w /work \
  mcr.microsoft.com/playwright:v<VERSION>-noble sleep 3600
docker exec visual-baseline-cap bash -c '
  mkdir -p /workc &&
  cd /work && tar --exclude=./node_modules --exclude=./.git --exclude=./.next \
    --exclude=./.turbo --exclude=./storybook-static -cf - . | (cd /workc && tar -xf -) &&
  cd /workc && corepack enable && corepack prepare pnpm@9.12.0 --activate &&
  pnpm install --frozen-lockfile &&
  pnpm exec turbo run build --filter=docs... &&
  pnpm -F docs start & disown &&
  npx --yes wait-on@8 http://localhost:3000 --timeout 60000 &&
  DOCS_URL=http://localhost:3000 pnpm visual:baseline
'

# 5. Copy the freshly captured baseline back out, replacing the old one, and stop the container.
rm -rf tests/visual/baseline
docker cp visual-baseline-cap:/workc/tests/visual/baseline tests/visual/baseline
docker rm -f visual-baseline-cap

# 6. Sanity-check: file count should be 110, total size a few MB. Spot-check a handful of images
#    (light/dark, desktop/mobile, at least one RTL) to confirm they're real rendered pages and not
#    error pages — scripts/visual-baseline.ts fails loudly (non-200 response or a rendered
#    Next.js error page) instead of silently saving a broken capture, but a manual look is cheap
#    insurance.
find tests/visual/baseline -name '*.webp' | wc -l
du -sh tests/visual/baseline
```

Commit the regenerated `tests/visual/baseline/` alongside the change that motivated it.

## Motion and embedded frames

Both scripts open every route with `reducedMotion: "reduce"`, so the landing page's looping
walkthrough animations render their final frame and the capture is deterministic. They also wait
for `networkidle` with a 90 second budget, because the landing page embeds several live example
frames whose own assets must finish loading before the screenshot means anything.

## Error-page guard

Both `scripts/visual-baseline.ts` and `scripts/visual-check.ts` check the HTTP response status of
every navigation and scan the rendered body for Next.js error-page markers ("Application error: a
client-side exception has occurred", "This page could not be found"). A non-200 response or a
matched marker throws immediately and exits non-zero rather than saving/diffing the broken capture
as if it were a normal screenshot — this is what should have caught a bad build long before a human
noticed a suspiciously small file.
