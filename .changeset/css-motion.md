---
"@properui/ui": patch
---

Replace the `motion` runtime with CSS transitions in the dual-tier and slim sidebar navigations'
secondary panel (width/border-color, previously a Framer spring inside `AnimatePresence`). Visual
behavior is unchanged; `motion` is no longer imported by `app-navigation`, so consumers of that
registry entry no longer pull in the `motion` package. `file-upload` (drag physics in
`draggable.tsx`, FLIP list-reorder animation in `file-upload-base.tsx`) still depends on `motion`
for cases CSS genuinely can't express.
