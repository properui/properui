# @properui/registry

## 0.1.0

### Minor Changes

- Adds `dist/flows.json` (13 curated user flows, from `src/flows.ts`) and `dist/thumbs.json` (light and dark thumbnail paths for example entries, scanned from `apps/docs/public/thumbs`). The build fails if a flow names a missing example, a step has no light thumbnail, or flow copy is out of shape. `stats.json` gains `flows` and `thumbnails`, and the package now has a contract test (`pnpm -F @properui/registry test`).
