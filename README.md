# Niveus

A tactile, adaptive interface language. Controls are bevelled keys with light
falling across them, fields are wells cut into the surface, windows are solid,
and glass is kept for the chrome that floats over everything else. Warm
graphite in dark, soft paper in light, one brand color driving both.

Niveus is a **design-system layer**, not a component library bolted onto an
application. Applications consume it; they do not redefine it. The visual rules
live here and can change without touching a line of application logic.

```html
<link rel="stylesheet" href="dist/niveus.css">   <!-- with fonts/ beside dist/ -->
```

Niveus ships its own faces in `fonts/`: Instrument Sans for the interface and
JetBrains Mono for code and engraved labels, both under the SIL Open Font
License. Copy `fonts/` alongside `dist/` (or `niveus/`) and they load by
themselves.

The stylesheet uses the variable `.woff2` files. `fonts/static/` holds the
same faces as plain TrueType files at the four weights Niveus uses (400, 500,
600, 700, plus Instrument Sans italics), for native toolkits and font
configurations that pick a weight by name rather than by variable axis.

```html
<html data-theme="dark">   <!-- omit data-theme to follow the system -->
```

Open `index.html` for the full specimen: materials, the elevation scale, every
semantic color, the type scale, and each component in both appearances.
`examples/` holds four complete products built with it.

**[REFERENCE.md](REFERENCE.md) is the complete API** — every class, token,
attribute and function, each listed beside the name the rest of the industry
uses for it. It is written to be read by a person *or* handed to a model on its
own: an assistant that has only that file can write correct Niveus markup
without seeing a line of the CSS. `tools/check.py` fails if a class exists in
the CSS and is missing from it.

---

## Using it

Reference the system, never restate it:

```css
/* No */
.thing { background: #ffffff; border-radius: 12px; padding: 10px 16px; }

/* Yes */
.thing {
  background: var(--nv-color-surface-elevated);
  border-radius: var(--nv-radius-md);
  padding: var(--nv-space-2-5) var(--nv-space-4);
  box-shadow: var(--nv-highlight-top), var(--nv-elevation-2);
}
```

Application-specific values are fine when they describe *your* content and
layout — a sidebar that happens to be 15rem wide, an aspect ratio, a grid
template. They are not fine when they restate the design language.

Everything ships inside the `niveus` cascade layer, so unlayered application
styles always win. Overriding a Niveus component never requires `!important`
or a longer selector.

## Structure

```
niveus/
├── tokens/          the values, appearance-agnostic
│   ├── color.css        palette + semantic roles
│   ├── typography.css   families, scale, weights, composite roles
│   ├── spacing.css      4px rhythm + control sizing
│   ├── radius.css       corner scale
│   ├── elevation.css    the 0–5 depth scale, inset, highlight, focus ring
│   ├── motion.css       durations, easings, displacement
│   └── materials.css    blur, backdrop recipes, material definitions
│
├── themes/          what those values become in each appearance
│   ├── light.css
│   └── dark.css
│
├── base.css         elements, before any component
├── continuity.css   how one state becomes the next
├── components/      surface, button, input, card, dialog, navigation,
│                    menu, disclosure, scroller, bed, badge, table
├── utilities.css    the short list
├── niveus.css       the entry point
└── niveus.js        optional — continuity for changes CSS cannot animate

examples/            four complete interfaces built from the system
├── ai-landing/      marketing page
├── ai-chat/         chat web app
├── it-shop/         hardware shop
└── dashboard/       monitoring dashboard
```

`niveus/niveus.css` is the authored entry point and works directly over HTTP.
`dist/niveus.css` is the same thing with the `@import` chain flattened into one
request — use it for anything shipped.

## Theming

A component never names a color. It names a **role**, and the appearance decides
what that role is made of:

`background` · `surface` · `surface-elevated` · `surface-inset` ·
`text-primary` · `text-secondary` · `text-tertiary` · `border` · `accent` ·
`success` · `warning` · `danger`

Each role resolves through `light-dark()`, pulling from `--nv-light-*` in
`themes/light.css` or `--nv-dark-*` in `themes/dark.css`. The appearance is
selected by `color-scheme`, which the theme files bind to `[data-theme]`:

| `data-theme` | Result                        |
| ------------ | ----------------------------- |
| *(absent)*   | follows the operating system  |
| `light`      | light, always                 |
| `dark`       | dark, always                  |

Dark is not light inverted. Surfaces get *lighter* as they rise, shadows deepen
rather than disappear, the accent moves up its ramp to stay legible, and the top
highlight thins to a faint rim.

## Materials and depth

**Material** answers what light does when it hits a surface. **Elevation**
answers how far that surface is from the canvas. They are independent.

| Material   | Use for                                        |
| ---------- | ---------------------------------------------- |
| `solid`    | content. The default.                          |
| `elevated` | surfaces that must be read before their context |
| `inset`    | fields, wells, tracks — anything recessed       |
| `frosted`  | chrome that content passes under: bars, toolbars |
| `glass`    | contextual layers where content behind must stay legible |

| Elevation | Relationship                    |
| --------- | ------------------------------- |
| 0         | flush — painted on the canvas   |
| 1         | resting — cards, rows, panels   |
| 2         | raised — anything that reacts   |
| 3         | floating — popovers, menus      |
| 4         | lifted — dialogs, sheets        |
| 5         | overlay — topmost, used sparingly |

Applied as classes: `.nv-material-frosted`, `.nv-elevation-3`. A shadow that is
on neither scale is a shadow that means nothing.

## Continuity

Every interaction should read as a continuation of the state before it. When
something moves, grows, collapses or changes appearance, the change itself
should be perceptible — where it came from, where it went, and why. The goal is
not to animate everything. It is that nothing pops into a new state the user
could have watched it reach.

| Change | How it stays continuous |
| ------ | ----------------------- |
| Selection moves between items | The marker itself travels. It is a pseudo-element with a shared `view-transition-name`, so the browser interpolates its old box into its new one. |
| Switching tabs | Panels cross-fade inside one box and slide with the direction of travel — forward one way, back the other. |
| Content expanding | `interpolate-size` lets `block-size: auto` animate, so content grows from the row that revealed it. Nothing is measured. |
| Menus and dialogs | A menu is anchored to its trigger and scales out of its edge; a dialog expands away from the control that opened it. |
| Theme change | The whole surface cross-fades. Surfaces also transition their own colors, so it glides even with no script. |
| Hover, press, focus, select | All have a duration. Marks grow from their centre, the switch thumb travels its track. |

Most of this is plain CSS. The three cases CSS cannot do alone — a selection
moving *between two elements*, one panel replacing another, and the whole page
changing appearance — need a view transition, which needs one line of script:

```js
nv.transition(() => {           // or document.startViewTransition directly
  previous.removeAttribute("aria-current");
  next.setAttribute("aria-current", "page");
});
```

`niveus.js` is optional and dependency-free. Without it every component still
works; changes simply arrive rather than travel. It also wires
`[data-nv-theme]`, `[data-nv-dialog]`, `[data-nv-tabs]` and `[data-nv-close]`
so the common cases need no code at all.

### One rule worth knowing

A `view-transition-name` must be unique among all rendered elements, or the
browser skips the transition entirely. Each selection group therefore needs its
own marker name:

```html
<nav class="nv-nav" style="--nv-selection-name: nv-sel-sidebar"> … </nav>
<nav class="nv-nav-tabs" style="--nv-selection-name: nv-sel-tabs"> … </nav>
```

Tab strips default to `nv-tabs-selection` and everything else to
`nv-selection`, which is enough for one of each per page.

### Motion under a transition

Transition layers always paint above the page, so a travelling marker cannot
stay behind the labels it passes the way it does at rest. Rather than let an
opaque marker wipe them, Niveus thins it while it is in flight: it stays
visible the whole way — it can still be followed — but reads as having lifted
off the surface to travel.

`prefers-reduced-motion` collapses every duration at the token level and skips
view transitions entirely. The change still happens; it just arrives.

## Color

The whole color system has one input:

```css
:root { --nv-brand: #d92e3f; }
```

From it the system derives the accent and its hover and press states, the text
that lands on it, the link color, the focus ring, the selection highlight, the
tint in the greys, and how far the status colors lean — for both appearances,
with nothing else to set. No component is involved: they all name roles, and
the roles re-derive.

Three things make a single input actually work rather than just recolor a
button:

**The label is derived, not chosen.** Every filled color computes its own
foreground by reading its lightness: below a threshold it resolves to
near-white, above it to near-black. A yellow brand gets dark labels and a navy
one light labels, and no one has to remember to update a second token.

**The color is moved until its label is readable.** A mid-tone is the one place
where neither white nor black reaches 4.5:1, so a brand that lands there is
darkened until white works — or, if already light, lightened until black does.
Hue and chroma are untouched; only lightness moves, and only as far as it must.
This is why a mid-tone green arrives slightly deeper than the swatch you set.

**The rest of the palette follows.** Status colors lean towards the brand by
`--nv-brand-harmony` (12%) — red still reads as danger, it just stops looking
borrowed from another system — and the greys carry `--nv-brand-tint` (4%) of
it, which is what stops an accent from looking stuck on. Set either to `0%` for
literal status colors and strictly neutral greys.

| Input | Default | What it does |
| ----- | ------- | ------------ |
| `--nv-brand` | `#4f6cff` | the one color everything derives from |
| `--nv-brand-tint` | `4%` | how much brand bleeds into the greys |
| `--nv-brand-harmony` | `12%` | how far status colors lean towards it |
| `--nv-contrast-pivot` | `0.7` | where "too mid-toned to carry a label" begins |
| `--nv-contrast-dark` / `-light` | `0.53` / `0.78` | how far either side a color is pushed |

### Branding a subtree

`data-nv-brand` re-derives the whole set for one region, so a section can carry
its own color without a second theme:

```html
<section data-nv-brand style="--nv-brand: #0d9488">
  <button class="nv-button nv-button--primary">Upgrade</button>
</section>
```

The attribute is required, not decoration: `var()` inside a custom property is
substituted where that property is *declared*, so a `--nv-brand` set on a bare
element would never reach the roles. `[data-nv-brand]` is the selector that
re-runs the derivation.

### Overriding a role outright

Deriving is the default, not a requirement. Any role can be set directly, for
the whole page or for a subtree:

```css
.danger-zone { --nv-color-accent: var(--nv-color-danger); }
```

Everything inside follows — buttons, focus rings, links, switches — because
none of them ever named a color.

## Examples

`examples/` holds four complete interfaces. Open `examples/index.html`, or go
straight to one:

| | | |
| --- | --- | --- |
| **Lumen** | `examples/ai-landing/` | AI product landing page — hero, features, a scrolling row, pricing, FAQ |
| **Lumen Chat** | `examples/ai-chat/` | chat web app — sidebar, transcript, composer, settings dialog with tabs |
| **Northwire** | `examples/it-shop/` | hardware shop — filters, product grid, stock states, basket |
| **Northwire Ops** | `examples/dashboard/` | monitoring dashboard — stat tiles, a chart, a service table, incidents |

They look like four different products. None of them overrides a component,
forks a token, or writes a color. What differs between them is one declaration:

```css
:root { --nv-brand: #ea580c; }   /* the shop */
```

Each links exactly two files from the system — `dist/niveus.css` and the
optional `niveus/niveus.js` — and then its own `app.css`, which contains grids,
widths and breakpoints and **not a single hex value**. `tools/check.py` enforces
that: a color anywhere in an example, other than `--nv-brand` itself, fails the
build. An example that quietly reaches for a hex value is no longer
demonstrating the system; it is demonstrating how to work around one.

Where an example needed something the system did not have, the answer was to
add it to the system: `.nv-badge` and `.nv-table` exist because these pages
asked for them.

## Philosophy

Niveus is not a folder of CSS. It is a set of decisions that have already been
made, so that building an interface stops being a series of small aesthetic
arguments.

**Niveus is not about making interfaces look physical. It is about making
digital surfaces feel understandable.** Depth, material and motion are here to
answer questions the user is already asking — what is this, is it above or
below, where did it come from, did my click register — and for nothing else. An
effect that answers no question is decoration, and decoration is what makes an
interface tiring.

### The principles, and what each one costs

| | |
| --- | --- |
| **Clarity** | Every element has a purpose. Decoration never competes with content. |
| **Soft physicality** | Depth comes from shadow, highlight and inset — not from ornament. |
| **Material** | Surfaces are made of something. Solid, elevated, inset, frosted, glass. |
| **Restraint** | No effect exists because it is possible. Translucency and shadow are spent, not sprinkled. |
| **Consistency** | The same control behaves the same way everywhere, including under a pointer. |
| **Adaptability** | Nothing is defined in terms of an appearance or a color. |
| **Continuity** | Nothing pops into a new state the user could have watched it reach. |

They constrain each other on purpose. Continuity says to animate the change;
restraint says most changes do not need it. Material says to use translucency;
restraint says only for layers that pass over content. When two pull in
different directions, restraint wins — a quiet interface with one thing moving
reads clearly, and a busy one does not.

### Where the line runs

Niveus decides **how the application looks and behaves**. The application
decides **what it does**. In practice:

- A color, a shadow, a radius, a duration, a control height → the system.
- A sidebar that happens to be 15rem wide, an aspect ratio, a grid template →
  the application.
- A value that is *about* your content is yours. A value that restates the
  design language is the system's, and hard-coding it is how a system quietly
  stops being one.

### Adding to the system

Three questions, in order:

1. **Can it be expressed with what already exists?** Most new requirements are
   an existing component with a modifier, or a pattern — a composition of
   components that needs no new CSS at all. The patterns on the specimen page
   introduce nothing.
2. **Is it a rule, or is it this once?** A component earns its place when it
   can be stated as a reusable principle. "Selection emphasis travels" is a
   rule. "This menu is 14px from its button" is not.
3. **Does it hold in both appearances, at every elevation, and under a
   pointer?** If it only works on white, or only when nothing is behind it, it
   is not finished.

A new token follows the same test. If a value appears three times and means the
same thing each time, it is a token. If it appears three times and means
something different each time, three different things were given the same
number by accident.

### Working on it

Every rule in this repo is checked rather than trusted:

- `tools/check.py` fails on a role defined for one appearance but not the
  other, a token referenced but never defined, any hard-coded color in a
  component *or an example*, and any class that exists in the CSS but is
  missing from `REFERENCE.md`.
- Contrast is measured, not assumed — the derived label on every filled color
  clears 4.5:1 for any brand.
- `tools/build.py --check` fails if `dist/` has drifted from the sources.

If a change cannot be made without breaking one of those, the change is
probably not the problem the system has.

## Components

| Class          | Notes                                                     |
| -------------- | --------------------------------------------------------- |
| `.nv-button`   | `--primary` `--subtle` `--ghost` `--danger` `--frosted` `--float`, `--sm`/`--lg`, `--icon`, `--pill`, `--block`, `.nv-button-group` |
| `.nv-input`    | with `.nv-field`, `.nv-input-group`, `.nv-select`, `.nv-checkbox`, `.nv-radio`, `.nv-switch`, `.nv-choice` |
| `.nv-card`     | `--elevated` `--floating` `--inset` `--frosted` `--interactive`, `.nv-card-grid` |
| `.nv-dialog`   | native `<dialog>`; `--sheet` `--compact` `--wide`          |
| `.nv-nav`      | `--vertical` `--plain` `--inline`, plus `.nv-nav-tabs`, `.nv-tab-panel` and `.nv-breadcrumbs` |
| `.nv-menu`     | anchored popover with `.nv-menu-trigger`, `__item`, `__separator`, `__label`, `__shortcut` |
| `.nv-disclosure` | native `<details>`; `.nv-disclosure-group`, plus `.nv-collapse` for other markup |
| `.nv-scroller` | snapping row inside `.nv-scroller-frame`, with edge fades and optional controls |
| `.nv-bed`      | ground that is visibly not ordinary background; `--quiet` `--vivid` `--single` `--flush` |
| `.nv-badge`    | state, not an action; `--accent` `--success` `--warning` `--danger`, `--solid` `--count` `--square` |
| `.nv-table`    | inside `.nv-table-frame`; `__number` `__actions`, `--compact` `--interactive` |
| `.nv-surface`  | materials and elevation as utilities                       |

Variants are defined by reassigning private `--_*` properties. Interaction —
the lift on hover, the sink on press, the focus ring — is written once per
component, so a new variant cannot drift from how the rest of the system
responds to a pointer.

## Accessibility

- One focus treatment system-wide: a contrast ring under an accent ring, so it
  stays visible on any surface including accent-filled controls.
- Controls shorter than 44px still get a 44px pointer target.
- `prefers-reduced-motion` collapses duration and displacement to zero at the
  token level — no component opts in individually.
- `prefers-reduced-transparency`, and browsers without `backdrop-filter`, fall
  back from frosted and glass to their solid equivalents.

## Tools

```bash
python3 tools/build.py          # flatten the @import chain into dist/niveus.css
python3 tools/build.py --check  # fail if dist/ is stale (for CI)
python3 tools/check.py          # enforce the system's own rules
```

`tools/niveus_css.py` is not a command: it is an evaluator for the subset of
CSS the token layer is written in (`oklch(from …)`, `color-mix()`,
`light-dark()`, `calc()`), with CSS Color 4 gamut mapping, plus `read_rules()`
for the component layer (which role a button's background is in each state).
Every port that cannot read CSS — Android, Qt — imports it from here to
generate its tokens and control recipes, so no platform restates a value by
hand.

`check.py` catches the failures that do not look broken: a role defined for one
appearance but not the other, a token referenced but never defined, and a
hard-coded color in a component.

## Browser support

Niveus uses `light-dark()`, cascade layers, `:has()`, `@starting-style` and
`allow-discrete` transitions — all baseline in current Chrome, Safari, Firefox
and Edge. `backdrop-filter` degrades to a solid surface where it is missing.

The continuity layer builds on newer platform features, each of which degrades
to the state change simply happening rather than travelling:

| Feature | Used for | Without it |
| ------- | -------- | ---------- |
| View transitions | travelling selection, tab panels, theme cross-fade | the change applies instantly |
| `interpolate-size` | disclosure height | content appears at full height (`.nv-collapse` still animates) |
| Anchor positioning | menus tied to their trigger | the menu centres itself |
| `popover` | menus, light dismiss | needs the application's own toggle |

---

> Niveus borrows from physical things only what makes a surface easier to
> understand: a key looks pressable, a well looks like a place to put
> something, and glass means something is floating.

---

## License

Niveus is licensed under the [Apache License 2.0](LICENSE). The fonts in
`fonts/` keep their own license, the SIL Open Font License 1.1
(`fonts/OFL-*.txt`), which allows bundling them with anything.

Made by **Nexoniarz**.
