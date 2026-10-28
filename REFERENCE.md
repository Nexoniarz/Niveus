# Niveus — reference

Every class, token, attribute and function the system exposes, with the name
the rest of the industry uses for it.

Two audiences:

- **People.** Find the thing you mean by its usual name, then use the class
  beside it.
- **Models.** This file is the whole API. Hand it over on its own and an
  assistant can build correct Niveus markup without seeing the CSS: it does not
  need to know *how* `.nv-nav-tabs` works, only that a tab list is spelled that
  way here. Nothing below is aspirational — `tools/check.py` fails if a class
  exists in the CSS and is missing from this file.

Everything ships inside the `niveus` cascade layer, so unlayered application
styles win without `!important`.

```html
<link rel="stylesheet" href="dist/niveus.css">   <!-- keep fonts/ beside dist/ -->
<script src="niveus/niveus.js" defer></script>   <!-- optional -->
<html data-theme="dark">                          <!-- omit to follow the OS -->
<style>:root { --nv-brand: #d92e3f; }</style>     <!-- the whole identity -->
```

---

## Button

| Class | Known as | Does |
| --- | --- | --- |
| `.nv-button` | button, secondary button | Raised surface. The default; use it for anything that is not *the* action. |
| `.nv-button--primary` | filled / CTA button | The single affirmative action in a view. |
| `.nv-button--subtle` | tonal button | Accent-tinted fill, no elevation. Mid-emphasis. |
| `.nv-button--ghost` | text / quiet button | No material until hovered. Lowest emphasis. |
| `.nv-button--danger` | destructive button | Irreversible actions only. |
| `.nv-button--frosted` | glass button | For use over imagery or frosted chrome. |
| `.nv-button--float` | FAB, overlay control | Floats over content: grows on hover instead of lifting, and keeps its own positioning via `--nv-button-offset`. |
| `.nv-button--sm` `.nv-button--lg` | size variants | 28px and 44px; default is 36px. |
| `.nv-button--icon` | icon button | Square. Requires `aria-label`. |
| `.nv-button--pill` | pill button | Fully rounded. |
| `.nv-button--block` | full-width button | Fills its container. |
| `.nv-button__icon` | button icon slot | Sizes an inline SVG to the label. |
| `.nv-button-group` | segmented control, button group | Buttons sharing edges; only outer corners round. |

States come from the element: `disabled`, `aria-disabled`, `aria-busy="true"`
(shows a spinner and keeps the width), `aria-pressed` for toggles.

## Form controls

| Class | Known as | Does |
| --- | --- | --- |
| `.nv-field` | form field, form group | Label + control + hint, correctly spaced. |
| `.nv-field__label` | field label | Add `data-optional="(optional)"` to append a muted suffix. |
| `.nv-field__hint` | helper text | Guidance below the control. |
| `.nv-field__error` | validation message | Pair with `aria-invalid="true"` + `aria-describedby`. |
| `.nv-input` | text field, form control | `input`, `textarea` and `select`. Inset material. |
| `.nv-input--sm` `.nv-input--lg` | size variants | Match the button sizes. |
| `.nv-input--color` | color well / swatch input | `input[type=color]` as a square swatch. |
| `.nv-input-group` | input with adornment | Wrapper for a field with a prefix or suffix. |
| `.nv-input-group__affix` | prefix / suffix adornment | Sits inside the field's recess. First child = leading, last = trailing. |
| `.nv-select` | select, dropdown | Wrapper that draws the chevron around a native `select.nv-input`. |
| `.nv-checkbox` | checkbox | Native input, custom mark. Supports `:indeterminate`. |
| `.nv-radio` | radio button | Native input, custom mark. |
| `.nv-switch` | toggle switch | Inset track, elevated thumb that travels. |
| `.nv-slider` | range slider, track bar | `input[type=range]`. Inset track, accent fill, knob thumb. Add `data-nv-var="--token"` to write its value into a CSS property. |
| `.nv-choice` | control with inline label | `<label>` wrapping a control and its text. |

## Pickers

| Class | Known as | Does |
| --- | --- | --- |
| `.nv-calendar` | calendar, date picker | Month grid on whatever surface you give it (`.nv-surface`, or `.nv-material-glaze` when floating). Configure with `data-nv-calendar` plus `data-nv-value` / `-min` / `-max` / `-locale` / `-week-start`. Fires `nv:date`. |
| `.nv-calendar__header` | calendar toolbar | Title and month-step buttons (`data-nv-calendar-step="-1"` / `"1"`). |
| `.nv-calendar__title` | month and year heading | Filled by `niveus.js`. |
| `.nv-calendar__grid` | day grid | `role="grid"`; built by `niveus.js` or written by hand. |
| `.nv-calendar__weekday` | weekday column header | |
| `.nv-calendar__day` | day cell | `aria-selected="true"` chosen · `aria-current="date"` today · `data-outside` neighbouring month · `disabled` out of range. |
| `.nv-timepicker` | time picker, wheel picker | Scroll-snap wheels built from `data-nv-timepicker` plus `data-nv-value="HH:MM"` / `-hours` (`24` default, `12` adds an AM/PM wheel) / `-step` / `-name` / `-format-toggle` (a third wheel of 24H / AM / PM; swipe it to change the format). The value is always 24-hour. Fires `nv:time`. Empty without the script; use `<input type="time" class="nv-input">` as the fallback. |
| `.nv-timepicker__wheels` | wheel row, picker body | Holds the columns and the selection lens. |
| `.nv-timepicker__column` | wheel, picker column | One scrolling list (`role="listbox"`). |
| `.nv-timepicker__option` | wheel row | `aria-selected="true"` is the row in the lens. |
| `.nv-timepicker__separator` | colon between wheels | |
| `.nv-picker` | select trigger, dropdown button | Goes on the trigger beside `.nv-input` and `.nv-menu-trigger`; chevron turns while its list is open. `data-empty` shows placeholder colour. |
| `.nv-menu--listbox` | popup list, listbox, combobox list | A `.nv-menu` whose `.nv-menu__item`s are `role="option"`. At least as wide as its trigger. `niveus.js` adds keys, type-ahead and filtering; trigger fires `nv:select`. |
| `.nv-menu__search` | list filter, combobox input | An `.nv-input` as the first child of a listbox; typing filters the options. |

## Card

| Class | Known as | Does |
| --- | --- | --- |
| `.nv-card` | card, panel | Resting container at elevation 1. |
| `.nv-card--elevated` | raised card | Elevation 2 — read before its surroundings. |
| `.nv-card--floating` | floating card | Elevation 3. |
| `.nv-card--inset` | well, sunken panel | Recessed into its parent. |
| `.nv-card--frosted` | glass card | Translucent, for use over imagery or a bed. |
| `.nv-card--interactive` | clickable card | Lifts on hover, sinks on press. |
| `.nv-card--flush` | edge-to-edge card | Removes part padding, for media or tables. |
| `.nv-card--lit` | accent-edge card, colored top border | A strip of light along the top edge in the card's tint, spilling a little down the face. For a card that belongs to something with a color. |
| `.nv-card--glow` | glowing card, highlighted card | Gives off its tint. For the one card that is *on* — the current plan, the live item. |
| `.nv-card--spotlight` | spotlight card, cursor glow | A soft light follows the pointer across the face (needs `niveus.js`). Showcases only. |
| `.nv-card__header` | card header | |
| `.nv-card__title` | card title | |
| `.nv-card__subtitle` | card subtitle, supporting text | |
| `.nv-card__body` | card content | |
| `.nv-card__footer` | card actions | |
| `.nv-card__footer--plain` | undivided card actions | Drops the divider above the footer. |
| `.nv-card__media` | card media | 16:9 image slot. |
| `.nv-card__link` | stretched link | Expands one link's hit area over the whole card. |
| `.nv-card-grid` | responsive card grid | Auto-fitting, equal-height columns. |

`--lit`, `--glow` and `--spotlight` combine with every elevation and with each
other. They take `--nv-card-tint` (the accent unless set on the card).

## Deck

| Class | Known as | Does |
| --- | --- | --- |
| `.nv-deck` | card stack, stacked cards | One surface in front of others of its kind. Every child shares one grid cell. |
| `.nv-deck__layer` | stack layer | A decorative card behind the front one, stepping back and dimming with depth. Up to two; mark them `aria-hidden="true"`. |

Hidden `.nv-tab-panel`s can live in a deck together: the front surface is
whichever one is showing.

## Dialog

Built on native `<dialog>`; open with `showModal()` or `nv.openDialog()`.

| Class | Known as | Does |
| --- | --- | --- |
| `.nv-dialog` | modal dialog | Elevation 4 over a blurred scrim. Focus trap and Escape are the platform's. |
| `.nv-dialog--sheet` | bottom sheet | Enters from the block end, flush to the edges. |
| `.nv-dialog--compact` `.nv-dialog--wide` | width variants | 24rem / 44rem; default 30rem. |
| `.nv-dialog__header` | dialog header | |
| `.nv-dialog__title` | dialog title | Point `aria-labelledby` at it. |
| `.nv-dialog__description` | dialog supporting text | |
| `.nv-dialog__body` | dialog content | The only scrolling region. |
| `.nv-dialog__footer` | dialog actions | |
| `.nv-dialog__footer--divided` | grounded dialog actions | For a footer sitting over scrollable content. |
| `.nv-dialog__close` | close button | Optical alignment for a ghost icon button. |

## Menu

Built on the `popover` attribute and anchor positioning. Trigger and menu name
the same anchor through `--nv-anchor`.

| Class | Known as | Does |
| --- | --- | --- |
| `.nv-menu` | dropdown menu, popover menu | Frosted surface anchored to its trigger. |
| `.nv-menu-trigger` | menu button | Sets `anchor-name` from `--nv-anchor`. |
| `.nv-menu__item` | menu item | `aria-checked="true"` draws a tick. |
| `.nv-menu__item--danger` | destructive menu item | |
| `.nv-menu__label` | menu section label / group heading | |
| `.nv-menu__separator` | menu divider | |
| `.nv-menu__shortcut` | keyboard shortcut hint, accelerator | Trailing muted text. |

## Navigation

| Class | Known as | Does |
| --- | --- | --- |
| `.nv-nav` | app bar, navigation bar, header | Frosted, sticky chrome. |
| `.nv-nav--vertical` | sidebar, side navigation | Full-height, solid; drops the translucency. |
| `.nv-nav--plain` | solid bar | Opaque instead of frosted. |
| `.nv-nav--static` | non-sticky bar | |
| `.nv-nav--inline` | inline nav group | A navigation used inside content, not as chrome. |
| `.nv-nav__brand` | brand / logo lockup | |
| `.nv-nav__list` | nav list | |
| `.nv-nav__item` | nav item, nav link | Selected via `aria-current`, `aria-selected` or `--active`. |
| `.nv-nav__item--active` | active nav item | For when no ARIA state fits. |
| `.nv-nav__section` | nav section heading | |
| `.nv-nav__icon` | nav icon slot | |
| `.nv-nav__badge` | count badge, notification badge | |
| `.nv-nav__spacer` | flexible spacer | Pushes what follows to the end. |
| `.nv-nav-tabs` | tab list, segmented tabs | Inset track; the selected tab lifts out of it. |
| `.nv-tab-panel` | tab panel | Hands over to the next panel inside the same box when `nv.selectTab` switches tabs. |
| `.nv-breadcrumbs` | breadcrumbs | |

## Disclosure

| Class | Known as | Does |
| --- | --- | --- |
| `.nv-disclosure` | disclosure, accordion item | A `<details>` whose height animates open and closed. |
| `.nv-disclosure--plain` | bare disclosure | No surface of its own. |
| `.nv-disclosure__summary` | disclosure trigger | The `<summary>`. |
| `.nv-disclosure__chevron` | chevron, caret | Rotates rather than swapping glyphs. |
| `.nv-disclosure__body` | disclosure content | |
| `.nv-disclosure-group` | accordion | Stacked disclosures sharing hairlines. |
| `.nv-collapse` | collapsible region | Same relationship for markup that cannot be a `<details>`. Toggle `data-open`. |

## Scroller

| Class | Known as | Does |
| --- | --- | --- |
| `.nv-scroller-frame` | carousel frame | Positions the controls; holds the track. |
| `.nv-scroller` | carousel, snap scroller, rail | Horizontal row with scroll snapping and fading edges. |
| `.nv-scroller--auto` | content-width items | Items size to content instead of the track. |

Set `--nv-scroller-item` for item width, `--nv-scroller-fade` for the edge fade.

## Badge

| Class | Known as | Does |
| --- | --- | --- |
| `.nv-badge` | badge, chip, tag, status pill | Non-interactive statement of state. |
| `.nv-badge--accent` | accent badge | |
| `.nv-badge--success` `.nv-badge--warning` `.nv-badge--danger` | status badges | Tone follows the semantic role. |
| `.nv-badge--solid` | filled badge | For the one badge that must be seen first. |
| `.nv-badge--count` | count badge | Tabular, borderless, min two digits. |
| `.nv-badge--square` | square badge | |
| `.nv-badge__dot` | status dot | |

## Tile

| Class | Known as | Does |
| --- | --- | --- |
| `.nv-tile` | icon tile, icon badge, feature icon | A small raised key holding one glyph: tinted face, glyph in its tint. Not interactive. |
| `.nv-tile--solid` | filled icon tile | Saturated face with a light glyph. |
| `.nv-tile--glow` | glowing icon tile | Lit from inside. |
| `.nv-tile--sm` `.nv-tile--lg` `.nv-tile--xl` | tile sizes | 32 / 56 / 72px; default 44px. |

`--nv-tile-tint` picks the color. An `<img>` inside fills the key, an `<svg>`
takes half of it.

## Avatar

| Class | Known as | Does |
| --- | --- | --- |
| `.nv-avatar` | avatar, profile picture | Round raised disc holding an `<img>` or initials. |
| `.nv-avatar--ring` | avatar ring, story ring | A ring in `--nv-avatar-tint`, set off by a gap of surface. |
| `.nv-avatar--glow` | glowing avatar | The ring, giving off its tint. |
| `.nv-avatar--sm` `.nv-avatar--lg` `.nv-avatar--xl` | avatar sizes | 28 / 64 / 96px; default 40px. |
| `.nv-avatar__status` | presence dot | Grey at rest. |
| `.nv-avatar__status--online` | online indicator | Lit green. |
| `.nv-avatar-group` | avatar stack, facepile | Overlapping row. |

## Stat

| Class | Known as | Does |
| --- | --- | --- |
| `.nv-stat-group` | stats row, KPI strip, readout | One recessed well holding several readings, split by hairlines. Wraps on its own. Use a `<dl>`. |
| `.nv-stat` | stat, metric, KPI | One reading: label, value, optional delta, in that order. |
| `.nv-stat__label` | metric label | `<dt>` inside a group. |
| `.nv-stat__value` | metric value, big number | `<dd>`; tabular numerals. |
| `.nv-stat__delta` | change, trend | |
| `.nv-stat__delta--up` `.nv-stat__delta--down` | positive / negative trend | Success and danger text. |

## Steps

| Class | Known as | Does |
| --- | --- | --- |
| `.nv-steps` | stepper, timeline, process, progress steps | Markers set into a rail cut into the surface. Horizontal, vertical below 40rem. Use an `<ol>`. |
| `.nv-steps--vertical` | vertical stepper, timeline | Always vertical. |
| `.nv-steps__item` | step | `data-state="done"` lights it and its stretch of rail; `aria-current="step"` lights the marker only. |
| `.nv-steps__marker` | step number, step knob | |
| `.nv-steps__body` | step content | |
| `.nv-steps__title` | step title | |
| `.nv-steps__text` | step description | |

## Skeleton

| Class | Known as | Does |
| --- | --- | --- |
| `.nv-skeleton` | skeleton, loading placeholder, shimmer | A shallow well where content will be, with a slow band of light crossing it. Still under reduced motion. |
| `.nv-skeleton--text` | text line placeholder | The last of several lines ends short. |
| `.nv-skeleton--circle` | avatar placeholder | |

## Table

| Class | Known as | Does |
| --- | --- | --- |
| `.nv-table-frame` | table wrapper | Scrolls sideways so the page does not have to. |
| `.nv-table` | data table | |
| `.nv-table--compact` | dense table | |
| `.nv-table--interactive` | clickable rows | |
| `.nv-table__number` | numeric cell | End-aligned, tabular figures. |
| `.nv-table__actions` | row actions cell | Shrinks to content. |

## Bed

| Class | Known as | Does |
| --- | --- | --- |
| `.nv-bed` | showcase surface, patterned backdrop | Ground that is visibly not ordinary background: for regions the user should look *at*. Gives translucent materials something to be translucent against. |
| `.nv-bed--quiet` | subdued bed | No hatch, softer blooms. |
| `.nv-bed--vivid` | emphatic bed | |
| `.nv-bed--single` | single-hue bed | One color instead of three. |
| `.nv-bed--flush` | full-bleed bed | Square, no side borders. |
| `.nv-bed__label` | bed label, eyebrow | |

Set `--nv-bed-tint` to lead with a color other than the accent.

## Window

| Class | Known as | Does |
| --- | --- | --- |
| `.nv-window` | window, app frame | A framed, solid window. Content never sits on glass. |
| `.nv-window--inactive` | unfocused window | Greys the lights and the title, drops one elevation. Hovering the lights restores their color. |
| `.nv-window__titlebar` | titlebar, header bar | Raised strip: controls · title · actions, with the title on the window's center line. |
| `.nv-window__controls` | traffic lights, window buttons | Group at the start of the bar. Its glyphs show while the pointer is over the group. |
| `.nv-window__control` | window button | One light. Needs `aria-label`, plus one of the three below. |
| `.nv-window__control--close` | close button | Red, ×. Always first. |
| `.nv-window__control--minimize` | minimize button | Yellow, −. Always second. |
| `.nv-window__control--zoom` | zoom, maximize button | Green, +. Always third. |
| `.nv-window__title` | window title | Truncates. |
| `.nv-window__actions` | titlebar actions | Trailing slot; put `.nv-button--ghost.nv-button--sm` here. |
| `.nv-window__body` | window content | Fills the rest and scrolls. |

The three lights keep fixed colors on purpose: they are found by position and
color before they are read, so they never take the brand.

## Surface, material and elevation

| Class | Known as | Does |
| --- | --- | --- |
| `.nv-surface` | surface, panel | Plain container on the solid material. |
| `.nv-material-solid` | opaque surface | Content lives here. The default. |
| `.nv-material-elevated` | raised surface | Separated from its context. |
| `.nv-material-inset` | recessed surface | Fields, wells, tracks. |
| `.nv-material-frosted` | frosted glass, blur backdrop | Chrome that floats over content: bars, docks, launchers, notifications, menus. Moderate blur, bevelled rim. |
| `.nv-material-glass` | glass | Contextual layers where content behind must stay legible. |
| `.nv-material-glaze` | glaze, adjustable frosted glass | Glass with a dial. Frost comes from `--nv-glass-frost` (0 clear … 1 heavy), read where the surface is drawn, so a subtree or a slider can change it. Rim catches light and follows the pointer with `niveus.js`. |
| `.nv-elevation-0` `.nv-elevation-1` `.nv-elevation-2` | elevation / z-depth | flush · resting · raised |
| `.nv-elevation-3` `.nv-elevation-4` `.nv-elevation-5` | elevation / z-depth | floating · lifted · overlay |
| `.nv-elevation-inset-sm` `.nv-elevation-inset-md` `.nv-elevation-inset-lg` | inner shadow | Recessed surfaces. |
| `.nv-divider` | divider, separator, rule | |
| `.nv-divider--vertical` | column rule | Stretches to its flex row. |

Material and elevation are independent: combine freely.

Niveus is solid by default, with glass used sparingly: anything that holds content
(windows, cards, dialogs) is solid, and only chrome floating over it is
frosted. Raised things are bevelled — lit along the top edge, shaded along the
bottom, with a contact outline — and carry a sheen across their face. When
composing your own raised element, use `box-shadow: var(--nv-bevel),
var(--nv-outline), var(--nv-elevation-2)` with `background-image:
var(--nv-sheen-raised)` over its role color.

## Type roles

| Class | Known as | Size |
| --- | --- | --- |
| `.nv-display` | display, hero text | 38px |
| `.nv-heading` | heading | 24px |
| `.nv-title` | title, subheading | 17px |
| `.nv-body` | body copy | 15px |
| `.nv-label` | label, UI text | 13px |
| `.nv-caption` | caption, secondary text | 12px |
| `.nv-overline` | overline, eyebrow, engraved label | 11px mono, uppercase, wide tracking |
| `.nv-code` | code, monospace | 13px |
| `.nv-text-primary` `.nv-text-secondary` `.nv-text-tertiary` | text color roles | Emphasis, not size. |
| `.nv-text-accent` `.nv-text-success` `.nv-text-warning` `.nv-text-danger` | semantic text colors | |
| `.nv-text-lit` | gradient text, metallic text | Lit from above, settling into the accent. One display line per page. |
| `.nv-text-lit--accent` | accent gradient text | The accent alone, lit from above — for a phrase inside a display line. |

## Reveal

| Class | Known as | Does |
| --- | --- | --- |
| `.nv-reveal` | scroll reveal, animate on scroll | Rises and fades in once, as it scrolls into view. Needs `niveus.js`; without it, or under reduced motion, nothing is hidden. |
| `.nv-reveal-group` | staggered reveal | Its children arrive one after another, `--nv-stagger` apart. |

## Layout utilities

| Class | Known as | Does |
| --- | --- | --- |
| `.nv-container` | page container, wrapper | Max width + gutters. |
| `.nv-stack` | stack, vertical rhythm | Column with a gap. |
| `.nv-stack--tight` `.nv-stack--loose` | stack density | |
| `.nv-cluster` | cluster, wrap row | Wrapping row, vertically centred. |
| `.nv-cluster--tight` | dense cluster | |
| `.nv-cluster--between` | spread cluster | Pushes children to both ends. |
| `.nv-truncate` | ellipsis, text truncation | One line with an ellipsis. |
| `.nv-prose` | prose, measure | Readable line length and leading. |
| `.nv-visually-hidden` | screen-reader-only, sr-only | Available to assistive tech, invisible on screen. |
| `.nv-continuous` | content region | Content that hands over in place (out, then in) when it changes. |
| `.nv-content` | view-transition class | Not an HTML class: the `view-transition-class` that gives a named element the hand-over animation. Set `view-transition-class: nv-content` on your own named element to get it. |
| `.nv-carried` | (view-transition class) | Applied to nav items so they ride above a travelling marker. |
| `.nv-travelling` | (view-transition class) | Applied to a selection marker so it travels below the labels. |

---

## Tokens

Names are stable; values are not. Never state a color, shadow, radius, size or
duration directly — reference the token.

### Color roles

`--nv-color-` +

```
background  background-subtle  surface  surface-elevated  surface-inset
surface-hover  surface-active  scrim

text-primary  text-secondary  text-tertiary  text-disabled  text-inverted
border-subtle  border  border-strong

accent  accent-hover  accent-active  accent-subtle  accent-subtle-hover
accent-border  accent-text  on-accent

success  success-hover  success-subtle  success-border  success-text  on-success
warning  warning-hover  warning-subtle  warning-border  warning-text  on-warning
danger   danger-hover  danger-active  danger-subtle  danger-border
danger-text  on-danger

shadow-ambient  shadow-penumbra  shadow-umbra  shadow-inset
highlight  highlight-strong  lowlight  outline  elevation-tint-1 … -5
sheen-top  sheen-bottom  sheen-strong-top  sheen-strong-bottom
knob  knob-shade
material-frosted  material-glass  material-border
window-close  window-minimize  window-zoom  window-inactive
window-control-ring  window-glyph
focus-ring  focus-ring-contrast  selection
glow
```

`on-*` is the text that goes on top of that color, and is derived — never set
it by hand.

### Color inputs

| Token | Default | Does |
| --- | --- | --- |
| `--nv-brand` | `#4f6cff` | The one color everything derives from. |
| `--nv-brand-tint` | `4%` | How much brand bleeds into the greys. |
| `--nv-brand-harmony` | `12%` | How far status colors lean towards the brand. |
| `--nv-contrast-pivot` | `0.7` | Lightness where a color can no longer carry a label. |
| `--nv-contrast-dark` / `-light` | `0.53` / `0.78` | How far either side a color is pushed. |

`--nv-palette-{neutral|accent|success|warning|danger}-{0…1000}` and
`--nv-palette-window-{close|minimize|zoom}` are raw values. Components must
never reference them.

### Scales

| Family | Steps |
| --- | --- |
| `--nv-space-` | `0 px 0-5 1 1-5 2 2-5 3 4 5 6 7 8 10 12 14 16 20 24 32` (suffix = px ÷ 4) |
| `--nv-radius-` | `none xs sm md lg xl 2xl full`, plus `nested-md` `nested-lg` |
| `--nv-font-size-` | `2xs xs sm md lg xl 2xl 3xl 4xl 5xl` |
| `--nv-font-weight-` | `regular medium semibold bold` |
| `--nv-line-height-` | `tight snug normal relaxed` |
| `--nv-letter-spacing-` | `tighter tight normal wide wider engraved` |
| `--nv-font-` | `display heading title body label caption code engraved` (composite shorthands) |
| `--nv-font-family-` | `sans` (Instrument Sans) `mono` (JetBrains Mono), both shipped in `fonts/` |
| `--nv-measure` | `-narrow` · `--nv-measure` · `-wide` |
| `--nv-control-height-` | `sm md lg` — also `control-padding-` and `control-gap-` |
| `--nv-elevation-` | `0 1 2 3 4 5`, `inset-sm` `inset-md` `inset-lg` |
| `--nv-highlight-` | `top` `top-strong` `edge` |
| bevel | `--nv-bevel` (lit top + shaded bottom) · `--nv-lowlight-bottom` · `--nv-outline` (contact line) · `--nv-ledge` (lit lower lip of a recess) |
| `--nv-sheen-` | `raised filled surface knob` — gradients laid over a role color as `background-image` |
| `--nv-blur-` | `sm md lg xl` — also `backdrop-frosted` `backdrop-glass` `backdrop-scrim` |
| `--nv-material-` | `{solid,elevated,inset,frosted,glass}-{bg,border,shadow}` |
| `--nv-glow-` | `sm md lg` (accent halos) · `blur-sm/md/lg` `spread-sm/md/lg` (geometry for a tinted glow) · `strength` (how much tint a glow carries) |

### Motion

| Family | Steps |
| --- | --- |
| `--nv-duration-` | `instant fast quick normal slow slower travel expand theme shimmer` |
| `--nv-ease-` | `standard entrance exit spring emphasized linear` |
| `--nv-transition-` | `colors depth control surface expand` (composites) |
| displacement | `--nv-lift-hover` `--nv-press-depth` `--nv-travel-sm/md/lg` |
| sequence | `--nv-stagger` — the gap between siblings arriving one after another |

`prefers-reduced-motion` collapses every duration and displacement at the token
level. Components never opt in individually.

### Other

`--nv-glass-frost` (0–1, the glaze material's one input; set on `:root` or any
subtree) · `--nv-glaze-blur-max` · `--nv-glaze-tint-min` ·
`--nv-glaze-tint-max` · `--nv-glaze-rim` · `--nv-light-x` / `--nv-light-y` /
`--nv-light-angle` (set by `niveus.js` on each glaze surface) ·
`--nv-slider-pos` (set by `niveus.js`) · `--nv-pull` (set by `niveus.js` on a time-picker wheel pulled past its end) · `--nv-focus-ring` · `--nv-focus-ring-width` · `--nv-border-width` ·
`--nv-border-width-strong` · `--nv-target-min` · `--nv-layout-gutter` ·
`--nv-layout-max-width` · `--nv-selection-name` · `--nv-anchor` ·
`--nv-button-offset` · `--nv-bed-tint` · `--nv-scroller-item` ·
`--nv-scroller-fade` · `--nv-content-name` · `--nv-card-tint` ·
`--nv-tile-tint` · `--nv-avatar-tint` · `--nv-pointer-x` / `--nv-pointer-y`
(set by `niveus.js`) · `--nv-reveal-index` (set by `niveus.js`)

---

## JavaScript

`niveus.js` is optional and dependency-free; it exposes `window.nv`. Without it
everything still renders — state changes simply arrive instead of travelling.

| Function | Signature | Does |
| --- | --- | --- |
| `nv.transition` | `(update, { direction, kind, scope }) => Promise` | Runs `update` inside a view transition so the change can be followed. `direction` is `"forward"`/`"backward"`; `kind: "theme"` slows the cross-fade; `scope` is the selection group (or list of groups) whose marker should travel — pass the group whose `aria-current`/`aria-selected` the update moves. Without `scope` nothing is lifted and the change cross-fades in place. Falls back to running `update` directly under reduced motion or without API support. |
| `nv.setTheme` | `("light" \| "dark" \| "system") => Promise` | Cross-fades the whole surface into the new appearance and fires `nv:theme` on `<html>`. |
| `nv.syncThemeControls` | `(theme) => void` | Sets `aria-pressed` on every `[data-nv-theme]`. |
| `nv.openDialog` | `(dialog \| id, trigger?) => dialog` | `showModal()`, plus a transform origin so the dialog expands out of its trigger. |
| `nv.selectTab` | `(tablist, tab) => Promise` | Moves selection and its panel, with direction. |
| `nv.initSlider` | `(input) => void` | Keeps one `.nv-slider`'s fill in step with its value, and applies `data-nv-var`. |
| `nv.initCalendar` | `(el) => void` | Builds and drives one `[data-nv-calendar]`. |
| `nv.initTimePicker` | `(el) => void` | Builds and drives one `[data-nv-timepicker]`. |
| `nv.initListbox` | `(list) => void` | Wires one `.nv-menu--listbox` (needs an `id` and a trigger with that `popovertarget`). |
| `nv.initScroller` | `(frame) => void` | Wires one scroller's controls. |
| `nv.liftLabels` | `(scope) => Element[]` | Names the navigation items in `scope` so a travelling marker passes behind them, and returns them. `nv.transition` does this for its `scope` and removes the names afterwards. |
| `nv.wire` | `(scope = document) => void` | Applies all of the below, and starts watching `.nv-reveal` / `.nv-reveal-group`. Runs once on load; call again after injecting markup. |
| `nv.prefersReducedMotion` | `() => boolean` | |

### Events

| Event | On | Detail |
| --- | --- | --- |
| `nv:date` | `.nv-calendar` | `{ value: "YYYY-MM-DD", date }` |
| `nv:time` | `.nv-timepicker` | `{ value: "HH:MM" }` (24-hour) |
| `nv:select` | picker trigger | `{ value, label }` |
| `nv:theme` | `<html>` | the new appearance |

### Data attributes

| Attribute | On | Does |
| --- | --- | --- |
| `data-theme` | `<html>` | `light` / `dark`. Absent follows the OS. |
| `data-nv-brand` | any element | Re-derives the whole color set for that subtree. |
| `data-nv-theme` | button | Sets the appearance when clicked. |
| `data-nv-dialog` | button | Opens the dialog with that id, from itself. |
| `data-nv-close` | button | Closes its dialog or popover. |
| `data-nv-tabs` | tablist | Wires `[role=tab]` children to their `aria-controls` panels, with arrow keys. |
| `data-nv-var` | `.nv-slider` | Name of the custom property (e.g. `--nv-glass-frost`) the slider writes its value to. It starts at that property's current value. |
| `data-nv-var-target` | `.nv-slider` | Selector of the element that receives the property. Default: `<html>`. |
| `data-nv-calendar` | `.nv-calendar` | Marks a calendar for `niveus.js`. Also `data-nv-value`, `-min`, `-max` (`YYYY-MM-DD`), `-locale`, `-week-start` (0 = Sunday). |
| `data-nv-calendar-step` | button in a calendar | `-1` or `1`: months to move. |
| `data-nv-timepicker` | `.nv-timepicker` | Marks a time picker. Also `data-nv-value` (`HH:MM`), `-hours` (`24` default / `12`), `-step` (minutes), `-name` (hidden form field), `-format-toggle` (adds the 24H / AM / PM wheel). |
| `data-nv-picker-label` | child of a picker trigger | Receives the chosen option's text; default is the trigger itself. |
| `data-nv-scroller` | `.nv-scroller-frame` | Wires its `[data-nv-scroll="prev"\|"next"]` controls. |
| `data-scrolled` | `.nv-nav` | Set by the application on scroll; gives the bar its shadow. |
| `data-nv-direction` | `<html>` | Set during a transition by `nv.transition`. |
| `data-nv-transition` | `<html>` | `"theme"` during an appearance change. |
| `data-nv-reveal` | revealed element | `pending` while waiting to scroll into view, `shown` while arriving; removed once it has. Set by `niveus.js`. |
| `data-nv-travelling` | selection group | Set by `nv.transition` on each `scope` for the length of the change; names its marker. |

---

## Rules that bite

1. **`view-transition-name` must be unique per document.** A duplicate makes
   the browser skip the transition entirely. Markers are only named while their
   group is in `scope`, so this only bites when one transition moves two groups
   at once: give each its own `--nv-selection-name`. `.nv-nav-tabs` defaults
   to `nv-tabs-selection` and everything else to `nv-selection`.
2. **A menu and its trigger must name the same anchor** through `--nv-anchor`,
   and the value must be unique per pair.
3. **Hide inactive `.nv-tab-panel`s with `hidden`.** `nv.selectTab` relies
   on it to know which panel is leaving.
4. **Never reference `--nv-palette-*` from application code.** It is raw, and
   does not adapt to the appearance.
5. **A floating control positioned with `translate`** needs
   `.nv-button--float` and `--nv-button-offset`, or the hover lift overwrites
   its position.
6. **Icon-only buttons need `aria-label`.** The system gives them a 44px target
   but cannot give them a name.

---

Made by **Nexoniarz**.
