---
"@properui/ui": minor
---

Adds six new component groups. Under `base/`: `HoverCard` (a rich hover/focus-triggered preview built on
`Popover`, for things a plain `Tooltip` can't hold, like a profile card with a Follow button), `Menubar` (an
application-style `File`/`Edit`/`View` menu bar built on React Aria's `Toolbar` plus the same `Menu`/`MenuTrigger`
primitives `Dropdown` uses, with hover-switching between open menus, submenus, and checkbox/radio items),
`NumberInput` (a `NumberField`-based numeric input with stacked or inline increment/decrement buttons and
`formatOptions` for currency/percent/unit display), and `TagInput` (type-to-add tags on Enter/comma, paste-splits-
on-commas, `maxTags`, a `validate` callback, and `isReadOnly`). Under `application/`: `Stepper` (a controlled
multi-step form wizard — distinct from the purely decorative `ProgressSteps` — with `canAdvance` validation, linear
and non-linear navigation, and horizontal/vertical layouts) and `Timeline` (vertical, alternating and horizontal
status timelines with `completed`/`current`/`upcoming` coloring).
