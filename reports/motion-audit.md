# CSS-only motion audit

Scope: every file under `packages/ui/src` that imports the `motion` runtime (`motion/react`),
`framer-motion`, `AnimatePresence`, or `useReducedMotion`.

## Search

```bash
grep -rn "from \"motion\|from 'motion\|framer-motion\|AnimatePresence\|useReducedMotion" packages/ui/src --include=*.tsx --include=*.ts
```

A broader `grep -rln "motion"` also turned up 17 files that only match the word "motion" inside
`motion-reduce:` / `motion-safe:` Tailwind utilities, `prefers-reduced-motion` comments, or the
English word "promotional" — none of those import the runtime and none needed changes:
`empty-state.tsx`, `messaging.tsx`, `modals.demo.tsx`, `notifications-provider.tsx`,
`text-editor-styles.ts`, the four `banner-countdown-*.tsx` files, `content-large-image-04.tsx`,
`menus.tsx`, `nav-menu.tsx`, `floating-feature-card.tsx`, `header-3-col-with-sidebar.tsx`,
`header-dropdown-feature-card.tsx`, both `social-proof-full-width-masked*.tsx`, and
`social-proof-sections.test.tsx`. They're already CSS-only (marquees use the `animate-marquee`
keyframe from `theme.css` plus `motion-reduce:animate-none`).

## Files that actually import the `motion` runtime

| File | What it animates | Can CSS express it? | Decision |
| --- | --- | --- | --- |
| `components/application/app-navigation/sidebar-navigation/sidebar-dual-tier.tsx` | Secondary sidebar panel: mount/unmount via `AnimatePresence`, `motion.div` spring-animates `width` 0 → 256px and `border-color` transparent → token, `type: "spring", damping: 26, stiffness: 220, bounce: 0` (critically damped, no overshoot) | **Yes.** Target width is a fixed constant (not `auto`), so it's a plain two-value transition, not the height/width-auto problem. A `bounce: 0` spring is visually just a fast ease-out with no overshoot. | **Migrated** to a CSS `transition-[width,border-color] duration-300 ease-out`, panel always mounted, `inert` + `aria-hidden` when collapsed instead of unmounting (keeps it out of the tab order and off the AT tree, same as the old exit-then-unmount behavior) |
| `components/application/app-navigation/sidebar-navigation/sidebar-slim.tsx` | Same pattern as above (slim variant, same widths/spring config) | **Yes**, identical case | **Migrated**, same technique |
| `components/application/file-upload/draggable.tsx` | Real pointer dragging (`drag`, `dragConstraints`, `dragMomentum={false}`) plus a `useSpring`-backed `scale` motion value that snaps to `0` on a successful drop | **No.** This is drag physics with live pointer tracking and constraint solving against a ref'd DOM rect — not an enter/exit or state transition CSS can express. | **Stays on `motion`.** Genuinely needs the runtime; already isolated (only this one file imports it inside `file-upload/`). |
| `components/application/file-upload/file-upload-base.tsx` | `AnimatePresence` wraps `FileUploadList`'s children; `FileListItemProgressBar`/`FileListItemProgressFill` are `motion.li` with `layout="position"` (no explicit `initial`/`animate`/`exit`) | **No, not without regression.** `layout="position"` is a FLIP repositioning animation: when an item is added/removed, Framer measures every sibling's before/after position and interpolates the shift, which is what makes items slide into their new slot instead of snapping. Plain CSS transitions never fire from a sibling's resize/removal — only from the animated element's own property changes — so reproducing this needs either the runtime or a hand-rolled FLIP measurer, which is exactly the "layout animations" case flagged as hard. Deletion here is also driven from outside the component (`onDelete` callback owned by the consumer), so there's no local exit-timing hook to attach a grid-rows collapse to without changing the component's contract. | **Stays on `motion`.** Isolated to this file; `draggable.tsx` in the same folder is the only sibling also using it. |

## Registry dependency impact

`packages/registry/src/build.ts` derives each entry's `dependencies` (npm packages) straight from
its files' imports (`motion/react` → `motion`, see `fileExternalDependencies`/`ALLOWED` in that
file) — there's no manifest field to hand-edit, and per the brief no generator was run here. Once
`pnpm gen:all` runs next:

- The **`app-navigation`** registry entry will stop declaring `motion` as a dependency (both files
  that imported it no longer do).
- The **`file-upload`** registry entry will keep declaring `motion` as a dependency — `draggable.tsx`
  and `file-upload-base.tsx` still import it, correctly, so `properui add file-upload` still pulls
  in the runtime it actually needs.
- No other registry entry ever depended on `motion`, so no other entry changes.

## `packages/ui/package.json`

Left untouched per instructions: `motion` stays in `dependencies` (not moved to
`optionalDependencies`). Registry entries declare their own npm deps at generation time (see
above), so the workspace package listing it as a normal dependency doesn't force it on consumers of
non-`motion` entries — only `file-upload`'s registry payload will list it going forward.

## Visual parity — before vs. after

Both sidebar variants (`sidebar-dual-tier.tsx`, `sidebar-slim.tsx`):

- **Before:** Framer spring, `damping: 26, stiffness: 220, bounce: 0`. With `bounce: 0` the spring
  is critically damped — no overshoot, and for these damping/stiffness values Framer's spring
  settles in ~280-320ms, which reads as a smooth, slightly eased deceleration into the resting
  width. Border color faded in immediately and faded out with a 50ms delay on the way out.
- **After:** CSS `transition-[width,border-color] duration-300 ease-out`. 300ms matches the
  settling time of the old spring almost exactly, and `ease-out` (fast start, slow finish) is the
  standard CSS approximation of a no-overshoot critically-damped spring — same visual shape, same
  duration, same start/end values (`0` ↔ `256px`, transparent ↔ `var(--color-border-secondary)`).
  The only observable difference: the old exit briefly delayed the border-color fade by 50ms after
  the width had already started shrinking; the new version fades both together. At 300ms total this
  is not perceptible.
- Focus/AT behavior is actually more correct now: previously the panel was removed from the DOM on
  exit (so React Aria's automatic exit-animation delay from `AnimatePresence` was the only thing
  keeping it around during the 300ms+50ms fade); now it's `inert` + `aria-hidden` while
  collapsed, so it can never be tabbed into or exposed to assistive tech while shown, whether
  collapsed or mid-transition, without waiting on unmount timing.

`draggable.tsx` and `file-upload-base.tsx`: unchanged, still running on `motion`.

## Counts

| | Before | After |
| --- | --- | --- |
| Files importing `motion`/`AnimatePresence` under `packages/ui/src` | 4 | 2 |
| Registry entries with a `motion` npm dependency (after next `pnpm gen:all`) | 2 (`app-navigation`, `file-upload`) | 1 (`file-upload`) |
| Lines of `motion`-authored animation code removed | — | ~50 (two `AnimatePresence`/`motion.div` blocks) |

## Tests run

```
cd packages/ui && npx vitest run src/components/application/app-navigation
# ✓ 2 files, 33 tests passed (sidebar-navigation.test.tsx, header-navigation.test.tsx)

cd packages/ui && npx tsc --noEmit 2>&1 | grep 'sidebar-dual-tier\|sidebar-slim'
# (no output — no type errors in the changed files)

cd packages/ui && npx eslint src/components/application/app-navigation/sidebar-navigation/sidebar-dual-tier.tsx \
  src/components/application/app-navigation/sidebar-navigation/sidebar-slim.tsx
# (no output — clean)

npx prettier --check packages/ui/src/components/application/app-navigation/sidebar-navigation/sidebar-dual-tier.tsx \
  packages/ui/src/components/application/app-navigation/sidebar-navigation/sidebar-slim.tsx
# All matched files use Prettier code style!
```

Token guard (manual grep, since `properui check` doesn't handle workspace paths) on both changed
files: no raw palette classes, no new arbitrary values, no `dark:` utilities, no physical
(`ml-/mr-/pl-/pr-/left-/right-/text-left/text-right`) properties introduced by this change. The
pre-existing `border-e-[1.5px]` arbitrary hairline-border value in both files predates this change
and was left as-is (out of scope).

`file-upload/` was not touched, so its existing test suite is unaffected and was not re-run.
