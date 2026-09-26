# Component API conventions

How Proper UI decides whether a component group is one component or several, how the parts of a
compound group are attached to each other, and the small set of idioms (`className`, `children`,
`href`, icon slots) that repeat across almost every file in `packages/ui/src/components`. This is
a survey of what the library already does, not a new proposal — every claim below was checked
against the source with `grep` on 2026-09-26, and the table is exhaustive as of that date.

## Flat props component, or compound?

Most groups are a single component with props: `Button`, `Badge`, `Checkbox`, `Toggle`, `Avatar`,
`Input`, `TextArea`, `Slider`. One call, one element (or a small fixed internal structure the
props control), nothing the caller assembles by hand. Reach for this shape whenever the group has
no independently-composable pieces — there is no scenario where a consumer needs `Badge`'s dot but
not its label, so `Badge` stays one component with a `type`/`color`/`size` prop set.

A group becomes **compound** — `Table.Header`, `Tabs.Panel`, `PageHeader.Actions` — when the
pieces are independently composable: a caller picks which parts appear, in what order, and what
goes inside them. `Table` is compound because a consumer chooses which columns exist and what
each cell renders; `Badge` isn't, because there's nothing to choose beyond its own props.

## The three compound shapes

Proper UI uses three different JavaScript shapes to build a compound API, and the choice between
them is not arbitrary:

### 1. Root component with slots attached (`Object.assign`)

The parent identifier is itself a renderable component _and_ carries its parts as static
properties:

```ts
export const Breadcrumbs = Object.assign(BreadcrumbsRoot, {
    Item: BreadcrumbsItem,
    Collapsed: BreadcrumbsCollapsed,
    Account: BreadcrumbsAccount,
    AccountMenu: BreadcrumbsAccountMenu,
});
```

Used for groups where the root itself renders real markup (a `<nav>`, a `<table>`, a header
section) and the slots decorate or fill it: `Breadcrumbs`, `ActivityFeed`, `MessageList`,
`Message`, `AIConversation`, `AIMessage`, `TreeView`, `ProgressSteps`, `TextEditor`.

### 2. Root component with slots attached (`as typeof X & { … }`)

Functionally identical to shape 1 — the root is directly renderable and the parts are attached
after the fact — just written as a type-cast plus individual assignment statements instead of one
`Object.assign` call:

```ts
const _Select = Select as typeof Select & {
    ComboBox: typeof ComboBox;
    Item: typeof SelectItem;
};
_Select.ComboBox = ComboBox;
_Select.Item = SelectItem;

export { _Select as Select };
```

Used for `Select`, `MultiSelect`, `TagSelect`, `PinInput`, `Table`, `SlideoutMenu`, `PageHeader`,
`FilterBar`, `EmptyState`, `DescriptionList`, `CommandMenu`. There is no behavioural difference
from shape 1 for a consumer — both produce `X` callable on its own _and_ `X.Part` callable — so
don't read anything into which one a given file uses; it's a stylistic accident of when the file
was written, not a signal.

### 3. Plain namespace object, root not directly renderable

```ts
export const Carousel = {
    Root: CarouselRoot,
    Content: CarouselContent,
    Item: CarouselItem,
    PrevTrigger: CarouselPrevTrigger,
    NextTrigger: CarouselNextTrigger,
    IndicatorGroup: CarouselIndicatorGroup,
    Indicator: CarouselIndicator,
};
```

`Carousel` itself is **not** a component — `<Carousel />` renders nothing; every real usage writes
`Carousel.Root`, `Carousel.Content`, etc. Used for the heavier, usually stateful "widget" groups
that have no single obvious root element to render bare: `Dropdown`, `Carousel`, `ColorPicker`,
`GradientPicker`, `Kanban`, `Pagination`, `FileUpload`, `ImagePicker`.

### A fourth, narrower case: flat sibling exports wrapping a multi-part React Aria primitive

When the underlying React Aria component is _already_ multi-part with its own context wiring
(`Tabs`/`TabList`/`Tab`/`TabPanel`, `RadioGroup`/`Radio`), Proper UI re-exports each part as its
own flat, top-level named export — `Tabs`, `TabList`, `Tab`, `TabPanel` — rather than inventing a
dot-notation on top of Aria's own composition model. There's no `Tabs.Panel`; you compose exactly
the way `react-aria-components` itself expects, just through Proper UI's styled wrappers.

## Every compound component in the repo

Root component and slot names, read directly off each file's `Object.assign(...)` call or
`as typeof X & { … }` block — grep `Object\.assign\(` and `as typeof \w+ & \{` in
`packages/ui/src/components` to reproduce this table.

| Root              | Shape          | File                                                | Slots                                                                                                                                                                                                                             |
| ----------------- | -------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Select`          | root + slots   | `base/select/select.tsx`                            | `ComboBox`, `Item`                                                                                                                                                                                                                |
| `MultiSelect`     | root + slots   | `base/select/multi-select.tsx`                      | `Item`, `Footer`, `EmptyState`                                                                                                                                                                                                    |
| `TagSelect`       | root + slots   | `base/select/tag-select.tsx`                        | `Item`                                                                                                                                                                                                                            |
| `PinInput`        | root + slots   | `base/input/pin-input.tsx`                          | `Slot`, `Label`, `Group`, `Separator`, `Description`                                                                                                                                                                              |
| `TextEditor`      | root + slots   | `base/text-editor/text-editor.tsx`                  | `Toolbar`, `SelectionToolbar`, `Group`, `Separator`, `Content`, `Hint`, `Bold`, `Italic`, `Underline`, `TextColor`, `AlignLeft`, `AlignCenter`, `AlignRight`, `BulletList`, `Link`, `Image`, `Generate`, `FontFamily`, `FontSize` |
| `Table`           | root + slots   | `application/table/table.tsx`                       | `Body`, `Cell`, `Head`, `Header`, `Row`                                                                                                                                                                                           |
| `SlideoutMenu`    | root + slots   | `application/slideout-menus/slideout-menu.tsx`      | `Trigger`, `Content`, `Header`, `Footer`                                                                                                                                                                                          |
| `PageHeader`      | root + slots   | `application/page-headers/page-headers.tsx`         | `Banner`, `Content`, `Heading`, `Title`, `Description`, `Avatar`, `Actions`, `Footer`                                                                                                                                             |
| `FilterBar`       | root + slots   | `application/filter-bar/filter-bar.tsx`             | `Root`, `Content`, `Actions`, `FilterRow`, `FilterIconButton`, `FilterButton`, `FilterDropdown`                                                                                                                                   |
| `EmptyState`      | root + slots   | `application/empty-state/empty-state.tsx`           | `Title`, `Header`, `Footer`, `Content`, `Description`, `Illustration`, `FeaturedIcon`, `FileTypeIcon`, `AvatarRadius`, `AvatarRow`, `AvatarGrid`                                                                                  |
| `DescriptionList` | root + slots   | `application/description-list/description-list.tsx` | `Item`, `Term`, `Details`                                                                                                                                                                                                         |
| `CommandMenu`     | root + slots   | `application/command-menu/command-menu.tsx`         | `Trigger`, `Popover`, `Search`, `List`, `Group`, `Item`, `Shortcut`, `Empty`, `Footer`                                                                                                                                            |
| `TreeView`        | root + slots   | `application/tree-view/tree-view.tsx`               | `Item`, `ItemContent`                                                                                                                                                                                                             |
| `ProgressSteps`   | root + slots   | `application/progress-steps/progress-steps.tsx`     | `Minimal`                                                                                                                                                                                                                         |
| `MessageList`     | root + slots   | `application/messaging/messaging.tsx`               | `Divider`                                                                                                                                                                                                                         |
| `Message`         | root + slots   | `application/messaging/messaging.tsx`               | `Bubble`, `Quote`, `File`, `Audio`, `Image`, `LinkPreview`, `LinkCard`, `Reactions`, `Reaction`, `Typing`                                                                                                                         |
| `Breadcrumbs`     | root + slots   | `application/breadcrumbs/breadcrumbs.tsx`           | `Item`, `Collapsed`, `Account`, `AccountMenu`                                                                                                                                                                                     |
| `ActivityFeed`    | root + slots   | `application/activity-feed/activity-feed.tsx`       | `Item`, `Link`, `File`, `Labels`, `Message`, `Quote`                                                                                                                                                                              |
| `AIConversation`  | root + slots   | `application/ai-elements/ai-conversation.tsx`       | `Content`, `ScrollButton`                                                                                                                                                                                                         |
| `AIMessage`       | root + slots   | `application/ai-elements/ai-message.tsx`            | `Actions`, `Action`                                                                                                                                                                                                               |
| `Dropdown`        | namespace only | `base/dropdown/dropdown.tsx`                        | `Root`, `Popover`, `Menu`, `Section`, `SectionHeader`, `Item`, `Separator`, `DotsButton`                                                                                                                                          |
| `Carousel`        | namespace only | `application/carousel/carousel-base.tsx`            | `Root`, `Content`, `Item`, `PrevTrigger`, `NextTrigger`, `IndicatorGroup`, `Indicator`                                                                                                                                            |
| `ColorPicker`     | namespace only | `application/color-picker/color-picker.tsx`         | `Provider`, `Panel`, `Area`, `HueSlider`, `AlphaSlider`, `EyeDropper`, `ColorFormatSelect`, `ColorValueInput`, `Swatches`, `SavedColors`, `Palette`, `Preview`                                                                    |
| `GradientPicker`  | namespace only | `application/gradient-picker/gradient-picker.tsx`   | `Provider`, `Area`, `Slider`, `TypeSelect`, `Reverse`, `StopList`, `SavedGradients`                                                                                                                                               |
| `Kanban`          | namespace only | `application/kanban/kanban.tsx`                     | `Board`, `Column`, `Card`                                                                                                                                                                                                         |
| `Pagination`      | namespace only | `application/pagination/pagination-base.tsx`        | `Root`, `PrevTrigger`, `NextTrigger`, `Item`, `Ellipsis`, `Context`                                                                                                                                                               |
| `FileUpload`      | namespace only | `application/file-upload/file-upload-base.tsx`      | `Root`, `List`, `DropZone`, `ListItemProgressBar`, `ListItemProgressFill`                                                                                                                                                         |
| `ImagePicker`     | namespace only | `application/image-picker/image-picker.tsx`         | `Provider`, `DropZone`, `FillModeSelect`, `RotateButton`, `AdjustmentSliders`                                                                                                                                                     |
| `Tabs`            | flat siblings  | `application/tabs/tabs.tsx`                         | `TabList`, `Tab`, `TabPanel` (separate top-level exports, not `Tabs.*`)                                                                                                                                                           |

If you're adding a new compound group: reach for shape 1 (`Object.assign`) unless you're touching
an existing file that already uses shape 2, in which case match that file's style — the two are
interchangeable for consumers. Use shape 3 (plain namespace) only when the group genuinely has no
sensible bare-root render, the way a color picker or a kanban board doesn't. Don't invent a
dot-notation on top of a React Aria primitive that is already itself multi-part; re-export its
parts flat instead, the way `Tabs` does.

## Icon and content slots

A prop typed to accept **either a component reference or an element** —
`iconLeading?: ComponentType<{ className?: string }> | ReactNode` on `Button`, `icon?: FC | ReactNode`
on `Select` — is Proper UI's icon-slot idiom, documented in full in [`AGENTS.md`](../AGENTS.md):
pass the bare component (`<Button iconLeading={ArrowRight}>`) so the wrapper can size it and set
`data-icon`, except from a true server component (no `"use client"`), which can't hand a component
reference across the boundary and must pass an element carrying `data-icon` itself
(`<ArrowRight data-icon="leading" />`).

## `className` merging

Every component merges an incoming `className` onto its own recipe with `cx()` (`@properui/ui/utils/cx`,
a thin `clsx` + `tailwind-merge` wrapper) — the caller's classes always come last, so they win
conflicts with the component's own Tailwind classes:

```tsx
className={cx(styles.common.root, styles.sizes[size].root, className)}
```

Some components go further and accept the same **function-of-render-state** shape React Aria's own
`className` prop accepts, when their prop type is inherited straight from an `Aria*Props` type
that already allows it (`Toggle`, `Checkbox`, `TextField`, `Select`'s root wrapper):

```tsx
className={(state) =>
    cx("relative flex w-max items-start", state.isDisabled && "cursor-not-allowed", styles[size].root,
       typeof className === "function" ? className(state) : className)}
```

`Button` is the counter-example: its `CommonProps.className` is a plain `string`, not a function,
because `ButtonProps`/`LinkProps` omit `className` from the underlying `Aria*Props` entirely rather
than inheriting it. Check the prop's declared type rather than assuming every component supports a
function `className` — whether it does follows directly from whether that type keeps or omits the
Aria prop it's built from.

## `children` as a React Aria render prop

Several components consume React Aria's `children`-as-a-function convention internally to read
interaction state, then translate it into class toggles — this is not something a consumer of
`Checkbox` or `Select` ever has to reach for; it happens inside the component:

```tsx
<AriaCheckbox {...ariaCheckboxProps} className={...}>
    {({ isSelected, isIndeterminate, isDisabled, isFocusVisible }) => (
        <CheckboxBase size={size} isSelected={isSelected} isIndeterminate={isIndeterminate} ... />
    )}
</AriaCheckbox>
```

`Select`'s root wrapper does the same with `{(state) => (...)}` to read `state.isRequired` /
`state.isInvalid` before rendering its `Label` and `HintText`. When you're building a new
component on top of an `Aria*` primitive that exposes interaction state this way, prefer reading it
through this render-prop `children`, not by re-deriving `isHovered`/`isFocusVisible`/etc. yourself
with your own event handlers — React Aria has already done the work correctly once.

## Composing with `href`

Two related idioms, both meant to avoid the consumer wrapping their own `<a>`:

- **A component takes an optional `href` and switches its own rendered element.** `Button`/`Link`
  is the fullest example (`href` is the discriminant between the `ButtonProps`/`LinkProps` overload
  branches, rendering `AriaLink` instead of `AriaButton`); `ActivityFeed.Item` and
  `Breadcrumbs.Item` do the same in miniature — `href` present renders `AriaLink`, absent renders a
  plain `<span>`/`<div>`.
- **Compose with `Button` itself for an inline link-styled action**, rather than reinventing link
  styling: `ActivityFeedLink` is `<Button href={href} size="sm" color="link-color" className="inline …">`,
  not its own anchor markup.

Reach for the first when the whole element the prop belongs to should become a link; reach for the
second when only a nested piece of text should.
