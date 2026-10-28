# Niveus Design Guidelines

**Status:** normative · **Version:** 1.0 · **Applies to:** every person and every
AI agent that designs with, builds on, or changes Niveus.

This document says what Niveus is, what it decides, and what it forbids. It is
written to be followed, not admired. Where it conflicts with a habit, a
preference, or a model's prior, this document wins.

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT** and **MAY** are
used as in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119). A **MUST** is
enforced by a tool or is a defect when broken. A **SHOULD** needs a stated
reason to break. A **MAY** is a freedom, not a recommendation.

---

## Contents

1. [How to use this document](#1-how-to-use-this-document)
2. [Identity](#2-identity)
3. [Principles and their order](#3-principles-and-their-order)
4. [Materials](#4-materials)
5. [Glaze](#5-glaze)
6. [Elevation and light](#6-elevation-and-light)
7. [Color and appearance](#7-color-and-appearance)
8. [Type, space and shape](#8-type-space-and-shape)
9. [Motion and continuity](#9-motion-and-continuity)
10. [Interaction and state](#10-interaction-and-state)
11. [Accessibility](#11-accessibility)
12. [Components](#12-components)
13. [Customization contract](#13-customization-contract)
14. [Authoring rules](#14-authoring-rules)
15. [Protocol for AI agents](#15-protocol-for-ai-agents)
16. [Changing the system](#16-changing-the-system)
17. [Anti-patterns](#17-anti-patterns)
18. [Compliance checklist](#18-compliance-checklist)

---

## 1. How to use this document

### 1.1 Sources of truth, in order of authority

When two sources disagree, the higher one is right and the lower one has a bug.

| # | Source | Answers |
| - | ------ | ------- |
| 1 | `tools/check.py`, `tools/build.py --check` | What is *allowed*. Mechanical, not negotiable. |
| 2 | **This document** | What is *intended*, and why. |
| 3 | [`REFERENCE.md`](REFERENCE.md) | What exists: every class, token, attribute, function, event. |
| 4 | [`README.md`](README.md) | How to install and orient. |
| 5 | The CSS and JS | How it is currently built. |

`REFERENCE.md` is the complete API. If a class, token or attribute is not in it,
**it does not exist** and MUST NOT be used, guessed, or invented.

### 1.2 Who this is for

- **Designers and engineers** use it to decide, and to review each other.
- **AI agents** use it as an operating contract. Section 15 is written for them
  directly; sections 2–14 apply to them as to anyone.
- **Product authors** who ship Niveus to end users use section 13 to decide what
  their users may customize.

### 1.3 What this document is not

It is not a style preference list. Every rule here exists because breaking it
produces a specific, nameable failure: an unreadable surface, a broken theme, a
control that behaves differently in two places, a port that has drifted. Rules
state their reason so they can be applied to cases the document did not foresee.

---

## 2. Identity

Niveus is a **design-system layer**, not a component library bolted onto an
application. Applications consume it; they do not redefine it.

**It is:** tactile (controls are bevelled keys with light falling across them),
adaptive (one brand colour drives light and dark), and continuous (state
changes can be followed). Fields are wells cut into a surface. Windows are
solid. Glass is kept for what floats.

**It is not:** a flat system, a material-for-its-own-sake system, or a
glassmorphism kit. Skeuomorphism here is **functional**: a surface imitates a
physical property only where that property answers a question the user is
already asking.

> Niveus is not about making interfaces look physical. It is about making
> digital surfaces feel understandable.

The questions a surface must answer are: **What is this? Is it above or below?
Where did it come from? Did my action register?** An effect that answers none
of them is decoration, and decoration makes an interface tiring.

### 2.1 Naming

Names in Niveus describe a thing's role, never another vendor's product. A
feature MUST NOT be named after a third party's trademark, and documentation
MUST NOT present a Niveus feature as a clone of one. (Niveus's adjustable-frost
glass is called **Glaze** for this reason.)

---

## 3. Principles and their order

| Principle | Rule | What it costs |
| --------- | ---- | ------------- |
| **Clarity** | Every element has a purpose. Decoration never competes with content. | Fewer flourishes. |
| **Soft physicality** | Depth comes from shadow, highlight and inset, not ornament. | No gratuitous textures. |
| **Material** | Surfaces are made of something: solid, elevated, inset, frosted, glass, glaze. | Every surface must pick one. |
| **Restraint** | No effect exists because it is possible. Translucency and shadow are spent, not sprinkled. | Saying no to good-looking things. |
| **Consistency** | The same control behaves the same way everywhere, including under a pointer. | No local variations. |
| **Adaptability** | Nothing is defined in terms of one appearance or one colour. | Every value is a role. |
| **Continuity** | Nothing pops into a state the user could have watched it reach. | Motion must be earned and bounded. |
| **Customizability** | Where the author allows it, the person using the product can tune it. | A bounded, documented set of dials. |

### 3.1 Precedence

When principles conflict, resolve in this order:

1. **Accessibility** (section 11) overrides everything. A beautiful surface that
   cannot be read or operated is broken.
2. **Clarity** overrides material and motion.
3. **Restraint** overrides every effect. A quiet interface with one thing moving
   reads clearly; a busy one does not.
4. **Consistency** overrides local preference.
5. **Customizability** operates *inside* the limits above, never through them.

---

## 4. Materials

A material answers *what light does when it hits a surface*. Elevation answers
*how far the surface is from the canvas*. They are independent and combine
freely.

| Material | Class | Use for | MUST NOT be used for |
| -------- | ----- | ------- | -------------------- |
| Solid | `.nv-material-solid` | Content. The default. | — |
| Elevated | `.nv-material-elevated` | Surfaces that must be read before their context. | — |
| Inset | `.nv-material-inset` | Fields, wells, tracks: anything recessed. | Anything that is pressed *toward* the user. |
| Frosted | `.nv-material-frosted` | Chrome that content passes under: bars, docks, menus, toolbars. | Containers of body copy or forms. |
| Glass | `.nv-material-glass` | Contextual layers where the content behind must stay legible. | Surfaces with no content behind them. |
| Glaze | `.nv-material-glaze` | Floating, interactive panes where the visitor's control over frost is a feature. See section 5. | Whole-page backgrounds; anything the user must read at length. |

### 4.1 Rules

1. **Solid by default.** Anything that *holds content* — windows, cards, dialogs,
   tables, forms — is solid. Translucency is reserved for what *floats over*
   content.
2. **Translucency means "this floats".** Used everywhere, it stops meaning
   anything, tints whatever is behind it, and forces the GPU to composite.
   Spend it.
3. **Raised things are bevelled and sheened.** Lit along the top edge, shaded
   along the bottom, with a contact outline. Compose with
   `box-shadow: var(--nv-bevel), var(--nv-outline), var(--nv-elevation-2)` and
   `background-image: var(--nv-sheen-raised)` over a role colour.
4. **Never invent a material.** If none fits, the right answer is a different
   composition, or a proposal under section 16 — not a local `backdrop-filter`.
5. **Translucent materials MUST degrade.** `prefers-reduced-transparency` and
   missing `backdrop-filter` fall back to the solid equivalent. A new
   translucent surface without that fallback is incomplete.

---

## 5. Glaze

Glaze is glass with a dial. It exists to make Niveus feel *alive* — a surface
that catches light and answers to the person looking at it — without giving up
legibility.

### 5.1 Anatomy

| Part | Mechanism | Controlled by |
| ---- | --------- | ------------- |
| **Frost** | Backdrop blur, tint opacity and saturation, moved together | `--nv-glass-frost`, `0` (clear) … `1` (heavy frost); range set by `--nv-glaze-blur-max`, `--nv-glaze-tint-min`, `--nv-glaze-tint-max` |
| **Rim** | A 1.5px masked gradient border, bright on the side facing the light | `--nv-glaze-rim` (width), `--nv-color-glaze-rim-lit` / `-far` |
| **Specular** | A soft bloom under the pointer | `--nv-color-glaze-specular` |
| **Light** | Pointer position and angle written per surface | `niveus.js` → `--nv-light-x/-y/-angle` |

Frost moves blur, tint and saturation **together** on purpose. A pane that
changed only one of them would stop looking like the same pane.

### 5.2 Rules

1. **Frost is read where the surface is drawn.** Set `--nv-glass-frost` on
   `:root` for the site, or on any subtree to change just that region. Never
   copy a frost value into another token; that breaks subtree overrides.
2. **Something colourful MUST be behind it.** Glaze over a flat canvas looks like
   a grey film. Use it over imagery, gradients, or an `.nv-bed`. If nothing is
   behind it, use `elevated`.
3. **Never place Glaze behind work.** Forms, tables and long reading belong on
   solid surfaces. Glaze is for what the user passes *through*: pickers,
   popovers, docks, notifications, hover cards, command surfaces.
4. **Text on Glaze MUST meet contrast at every frost the person can choose.**
   Clear glass over a busy backdrop is the worst case. A pane carrying body text
   SHOULD bound its slider (`min="0.2"` or higher) so the lowest setting is
   still legible. Verify against the busiest content that can sit behind it.
5. **Do not stack Glaze.** Glaze over Glaze compounds blur and tint into mud.
   One translucent layer between content and the eye.
6. **Do not animate the blur radius.** Blur is expensive; change frost by
   discrete steps or on user input, not as ambient motion.
7. **No JavaScript, no problem.** Without `niveus.js` the light sits at its
   default (top left) and the material is still correct. Light tracking MUST
   NOT be required for legibility, and is skipped for touch and under reduced
   motion.
8. **Position.** Glaze carries zero-specificity `position: relative`; a menu or
   dialog using it keeps the positioning its own component gave it.

---

## 6. Elevation and light

Six levels, each describing one relationship between a surface and the canvas.
A shadow that is on neither scale is a shadow that means nothing.

| Level | Class | Relationship | Typical use |
| ----- | ----- | ------------ | ----------- |
| 0 | `.nv-elevation-0` | flush | painted on the canvas |
| 1 | `.nv-elevation-1` | resting | cards, rows, panels |
| 2 | `.nv-elevation-2` | raised | anything that reacts |
| 3 | `.nv-elevation-3` | floating | popovers, menus |
| 4 | `.nv-elevation-4` | lifted | dialogs, sheets |
| 5 | `.nv-elevation-5` | overlay | topmost; used sparingly |

Inset depth uses `.nv-elevation-inset-{sm,md,lg}`.

1. **Light comes from above.** Highlights sit on top edges, shade on bottom
   edges. A highlight on a lower edge is a bug.
2. **Dark is not light inverted.** Surfaces get *lighter* as they rise, shadows
   deepen, and the top highlight thins. Elevation therefore carries a tint, not
   only a shadow.
3. **Elevation tracks the user's mental model, not the visual taste.** Raise
   what the user can act on or must notice; do not raise to decorate.
4. **A recess catches light on its lower lip** (`--nv-ledge`). Wells are cut into
   the surface, not painted darker.

---

## 7. Color and appearance

### 7.1 The model

The whole colour system has **one input**: `--nv-brand`. Every role, in both
appearances, is derived from it with relative colour syntax. There is no second
place to define a colour.

- A component names a **role** (`--nv-color-*`); the appearance decides what the
  role is made of, through `light-dark()`.
- `--nv-palette-*` is raw and does not adapt. **MUST NOT** be referenced from
  application code.
- Appearance is `data-theme="light" | "dark"`, or absent to follow the OS.
- A subtree may rebrand with `data-nv-brand`.

### 7.2 Rules

1. **No literal colours** in components or examples (the sole exception is the
   value of `--nv-brand`). `tools/check.py` fails on any.
2. **Every role exists in both appearances.** Adding `--nv-light-x` without
   `--nv-dark-x` fails the parity check.
3. **Contrast is measured, not assumed.** The derived label on any filled colour
   clears 4.5:1 for any brand. New roles that carry text MUST do the same.
4. **State is never colour alone.** Pair colour with a shape, icon, text or
   attribute change (see 11).
5. **Semantic colours mean one thing.** `success`, `warning`, `danger` carry
   meaning; they are not accents. Use `accent` for emphasis and brand.
6. **Dark mode is designed, not generated.** When a new surface is added, look at
   it in dark. If it only works on white, it is not finished.

---

## 8. Type, space and shape

- **Type.** Instrument Sans for the interface, JetBrains Mono for code and
  engraved labels, shipped in `fonts/`. Use the role classes — `.nv-display`,
  `.nv-heading`, `.nv-title`, `.nv-body`, `.nv-label`, `.nv-caption`,
  `.nv-overline` — not raw sizes. Sizes are in `rem` so the user's own font
  size is respected. Tabular figures (`font-variant-numeric: tabular-nums`) for
  any number that changes or aligns.
- **Space.** A 4px rhythm, expressed as `--nv-space-*`. Values are tokens; a
  one-off `13px` is a defect.
- **Shape.** `--nv-radius-*`. Nested radii MUST be concentric: use
  `--nv-radius-nested-*`, or the outer radius minus the gap. Pills
  (`--nv-radius-full`) are for pills, avatars and switches.
- **Logical properties.** Use `inline`/`block` (`padding-inline`,
  `inset-block-start`), never `left`/`right`, so the system works in RTL.
  Where a property has no logical form (`translate`), flip it explicitly for
  RTL.
- **Application-specific values** that describe *your content* — a 15rem sidebar,
  an aspect ratio, a grid template — are yours. A value that restates the design
  language is the system's, and hard-coding it is how a system quietly stops
  being one.

---

## 9. Motion and continuity

Every interaction MUST read as a continuation of the state before it. The goal is
not to animate everything. It is that **nothing pops into a state the user could
have watched it reach.**

### 9.1 Rules

1. **Motion explains.** It shows where something came from, where it went, or
   that an action registered. Motion with no such job is removed.
2. **Durations and easings are tokens.** `--nv-duration-*`, `--nv-ease-*`,
   `--nv-transition-*`. A literal `200ms` is a defect, and it bypasses reduced
   motion.
3. **Reduced motion collapses at the token level.** Components never opt in
   individually. `prefers-reduced-motion` skips view transitions entirely; the
   change still happens, it just arrives.
4. **Selection travels.** When emphasis moves between elements, the marker
   itself moves (shared `view-transition-name`). When a panel replaces another,
   it slides in the direction of travel.
5. **View transition names are unique per document.** A duplicate makes the
   browser skip the transition. Give each selection group its own
   `--nv-selection-name`.
6. **Origin matters.** Menus scale out of their trigger's edge; dialogs expand
   away from the control that opened them.
7. **No JavaScript, no breakage.** Continuity enhances; it MUST NOT be required
   for function.
8. **Restraint wins ties.** When continuity and restraint conflict, animate less.

---

## 10. Interaction and state

1. **One treatment per state, written once per component.** Hover lift, press
   sink and focus ring are defined once; a new variant MUST NOT redefine them.
   Variants are made by reassigning private `--_*` properties.
2. **Hover is guarded.** Hover styles live in `@media (hover: hover)`. Touch
   devices never see a stuck hover.
3. **Pressed means pressed.** Raised controls sink on press. A control that does
   not respond to a press does not look pressable.
4. **Targets are at least 44px**, including controls drawn smaller (the system
   extends the pointer target).
5. **Every state has a visible form:** default, hover, focus-visible, active,
   selected, disabled, invalid, loading. A component missing one is unfinished.
6. **Disabled is not hidden.** A disabled control keeps its place, dims, and
   uses `not-allowed`. Prefer explaining *why* over disabling silently.
7. **Selection state lives in attributes with a platform meaning:**
   `aria-selected`, `aria-current`, `aria-pressed`, `aria-checked`,
   `aria-invalid`, `disabled`, `data-outside`. Not in ad-hoc classes.

---

## 11. Accessibility

Accessibility is a precondition, not a feature. Target **WCAG 2.2 level AA**.
Niveus provides the base; the author is responsible for the rest.

**Provided by the system:**

- One focus treatment: a contrast ring under an accent ring, visible on any
  surface including accent-filled controls.
- A minimum 44px pointer target.
- `prefers-reduced-motion` and `prefers-reduced-transparency` honoured at the
  token level.
- Filled colours with a derived on-colour that clears 4.5:1.

**Required of the author:**

1. **Icon-only buttons MUST have `aria-label`.** The system cannot name them.
2. **Use native elements** — `<button>`, `<dialog>`, `<details>`, `<input>` —
   before ARIA. ARIA repairs; it does not replace.
3. **Keyboard parity.** Everything pointer-operable is keyboard-operable, with a
   visible focus order that follows reading order.
4. **Labels.** Every field has a programmatic label. Errors pair
   `aria-invalid="true"` with `aria-describedby` pointing at the message.
5. **Dialogs and popovers** trap or restore focus (native `<dialog>` and
   `popover` do; custom ones MUST).
6. **Live regions** (`aria-live`) for content that changes without focus —
   a calendar's month title is one.
7. **Test the extremes.** Verify text on translucent materials at the
   lowest-contrast backdrop and the lowest frost; verify at 200% text size and
   in both appearances.
8. **Do not rely on colour, motion or transparency to carry meaning.**

---

## 12. Components

The complete list and API live in `REFERENCE.md`. These are the rules for
*choosing and composing*.

1. **Compose before you create.** Most needs are an existing component plus a
   modifier, or a pattern — a composition that needs no new CSS.
2. **Native first.** A native `<select>` (`.nv-select`) is the default choice for
   a short list. Use the popup list (`.nv-picker` + `.nv-menu--listbox`) when you
   need search, rich options, or anchored positioning; it re-implements keys,
   type-ahead and filtering, so it must earn its place.
3. **Pickers.**
   - **Calendar** (`.nv-calendar`): holds content, so it takes no material of its
     own — put it on `.nv-surface`, or on Glaze when it floats. Six weeks every
     month so it never changes height. The grid and states are plain markup;
     `niveus.js` only builds days, steps months and provides keyboard movement.
   - **Time picker** (`.nv-timepicker`): scroll-snap wheels. **24-hour is the
     default**; `data-nv-format-toggle` adds a 24H / AM/PM switch beneath, and
     AM/PM adds a third wheel. The value is always 24-hour (`HH:MM`), so a form
     never needs to know which the person used. For a no-script fallback use
     `<input type="time" class="nv-input">`; the wheels are an enhancement, not
     the only path.
   - **Popup list** (`.nv-menu--listbox`): needs an `id`, a trigger with that
     `popovertarget`, and one shared `--nv-anchor` name per pair.
   - **Slider** (`.nv-slider`): a native range input; bind it to a token with
     `data-nv-var`.
4. **Overlays.** Menus and popovers anchor to their trigger. A menu and trigger
   MUST name the same `--nv-anchor`, unique per pair. Light dismiss, Escape and
   top-layer stacking come from `popover`; do not script them.
5. **A component earns its place** when it can be stated as a reusable rule.
   "Selection emphasis travels" is a rule. "This menu is 14px from its button"
   is not.
6. **Variants reassign private properties** (`--_*`); they do not restate
   interaction.

### 12.1 Not yet in the system

The following are known gaps. Until they ship, compose from existing parts, and
do not fake them with unlisted classes: toast/snackbar, tooltip, drawer, alert
banner, progress and spinner, chips, segmented control, pagination, command
palette, context menu, date-range selection, a `data-nv-style` personality
switch.

---

## 13. Customization contract

Niveus lets the **author** decide what the **person using the product** may
tune. This is a first-class goal, bounded by sections 3.1 and 11.

| Dial | Mechanism | Safe to expose to end users? |
| ---- | --------- | ---------------------------- |
| Appearance | `data-theme`, `data-nv-theme` buttons | **Yes.** Always offer system, light, dark. |
| Brand colour | `--nv-brand`, `data-nv-brand` | **Yes**, within the contrast guarantee (7.2.3). |
| Frost | `--nv-glass-frost` via `.nv-slider[data-nv-var]` | **Yes**, with a floor where text sits on Glaze (5.2.4). |
| Motion | the OS setting | **Respect, do not override.** Never add a control that forces motion on. |
| Transparency | the OS setting | **Respect, do not override.** |
| Density, radius, type scale | tokens | Possible; expose only as named presets, not free values. |

**Rules**

1. **Customization changes tokens, never component CSS.** If a dial needs a new
   selector, it is a new feature and goes through section 16.
2. **Free-form values are a hazard.** Expose steps or bounded ranges; never raw
   colour or size inputs that can break contrast or layout.
3. **Persist deliberately.** If a choice is saved, it is the author's
   responsibility (the system stores nothing), and the page MUST render
   correctly before the stored value is read.
4. **The default is the product.** Most people never open settings. The default
   configuration must be correct, accessible and good-looking on its own.
5. **Per-subtree overrides are the unit.** Tokens like `--nv-glass-frost` and
   `data-nv-brand` apply to a region, which lets one product mix a calm
   content area with a lively floating layer.

---

## 14. Authoring rules

### 14.1 CSS

1. **Reference the system, never restate it.**

   ```css
   /* No */
   .thing { background: #fff; border-radius: 12px; padding: 10px 16px; }

   /* Yes */
   .thing {
     background: var(--nv-color-surface-elevated);
     border-radius: var(--nv-radius-md);
     padding: var(--nv-space-2-5) var(--nv-space-4);
     box-shadow: var(--nv-highlight-top), var(--nv-elevation-2);
   }
   ```

2. **Everything ships in the `niveus` cascade layer.** Application styles are
   unlayered and win by default. Overriding Niveus MUST NOT require `!important`
   or selector escalation. If it does, the structure is wrong.
3. **Naming.** `nv-` prefix; BEM `__element` and `--modifier`; `--_name` for
   component-private properties; `--nv-` for public tokens.
4. **Layer order is fixed:** tokens → theme → base → continuity → components →
   utilities. Do not rely on file load order.
5. **A header comment explains *why*,** not what. Match the density and idiom of
   the file you are in.
6. **Register new files** in `niveus/niveus.css` with `layer(niveus.components)`,
   then rebuild. **Never hand-edit `dist/`.**
7. **`niveus/tokens` and `niveus/themes` use a deliberately narrow CSS subset**
   (`rgb`, `oklch`, `color-mix in oklab`, `light-dark`, `var`, `calc`, `clamp`,
   `min`, `max`) so ports can evaluate them. Component CSS is not so limited.

### 14.2 JavaScript

1. **Optional and dependency-free.** Everything works without it; it adds
   continuity and the keyboard models CSS cannot provide.
2. **Declarative first.** Behaviour is attached through `data-nv-*` attributes and
   wired by `nv.wire(scope)`. Call `nv.wire` again after injecting markup.
3. **Events are namespaced `nv:`** and documented in `REFERENCE.md`.
4. **Respect reduced motion** via `nv.prefersReducedMotion()`.
5. **One listener, one write per frame** for pointer-driven effects.
6. **ES5-compatible style** in `niveus.js`, to match the file.

### 14.3 Documentation

Every new class, token, attribute, function or event is added to `REFERENCE.md`
**in the same change.** `check.py` fails otherwise, and a documented thing that
no longer exists is worse than a missing one.

---

## 15. Protocol for AI agents

This section is an operating contract. If you are a model generating or changing
Niveus code, follow it literally.

### 15.1 Before you write

1. **Read `REFERENCE.md` in full.** It is the entire API. Do not rely on memory
   of other design systems.
2. **Identify the task type:** *consume* (build an interface with Niveus) or
   *change* (modify Niveus itself). Section 15.3 applies to the first, 15.4 to
   the second.
3. **State your assumptions** about which components, materials and appearance
   apply, when the request is ambiguous. Ask only when the answer would change
   what you build and cannot be inferred.

### 15.2 Hard rules (never break)

- **MUST NOT** invent a class, token, attribute, function or event. If it is not
  in `REFERENCE.md`, it does not exist.
- **MUST NOT** write a literal colour, shadow geometry, duration or easing. Use
  tokens.
- **MUST NOT** reference `--nv-palette-*`.
- **MUST NOT** use `!important`, inline `style` for visual values, or `left/right`
  where a logical property exists.
- **MUST NOT** put Glaze, frosted or glass behind content the user works in.
- **MUST NOT** name anything after another vendor's trademark.
- **MUST NOT** hand-edit `dist/`.
- **MUST NOT** weaken a check, delete a rule, or widen an allowlist to make a
  change pass. If a change cannot be made without breaking a check, the change
  is probably not the problem the system has. Report it.
- **MUST** keep interaction states complete, and both appearances correct.
- **MUST** leave the page legible when `niveus.js` fails to load.

### 15.3 Consuming Niveus

1. Choose the **material** by what the surface does (section 4), then the
   **elevation** by its relationship to the canvas (section 6).
2. Compose existing components; reach for a pattern before new CSS.
3. Use role classes for type, tokens for space and shape.
4. Give icon-only buttons `aria-label`; label every field.
5. Include `data-theme` handling only if the product offers a toggle; otherwise
   follow the OS.
6. Application CSS goes in unlayered styles and uses only tokens for anything
   that is *about the design language*.

### 15.4 Changing Niveus

1. Apply the three questions of section 16 **before** writing code, and say the
   answers.
2. Make the smallest change that satisfies a rule, not the most complete one.
3. Colours: add `--nv-light-*` **and** `--nv-dark-*` in `themes/`, then the role
   in `tokens/color.css`. Both, always.
4. Add the class/token/attribute to `REFERENCE.md` in the same change.
5. Register new component files in `niveus/niveus.css`.
6. **Run the gates, in order, after every file, not only at the end:**

   ```bash
   python3 tools/build.py          # regenerate dist/
   python3 tools/check.py          # parity, references, hard-coded colours, docs
   python3 tools/build.py --check  # dist/ matches sources
   ```

7. **Look at it.** Render both appearances in a real browser at a realistic size
   and inspect the result. Passing checks prove the rules; they do not prove it
   looks right or works. Exercise interactive components, not just their markup.
8. **Report faithfully.** State what you verified, what you could not, and what
   failed. A test that failed because of the test harness is still reported.

### 15.5 Behaviour

- **Prefer the smaller diff.** Do not refactor, rename or restyle beyond the
  task.
- **Prefer doing to asking,** except for actions that are hard to reverse or
  outward-facing (publishing, deleting, force-pushing), which need explicit
  authorization.
- **Surface conflicts** between a request and this document. Do not silently
  pick a side: say which rule is in tension, and recommend.

---

## 16. Changing the system

### 16.1 The three questions

Ask in order, and stop at the first *yes* to question 1.

1. **Can it be expressed with what already exists?** Most new requirements are
   an existing component with a modifier, or a composition that needs no new
   CSS.
2. **Is it a rule, or is it this once?** A component earns its place when it can
   be stated as a reusable principle.
3. **Does it hold in both appearances, at every elevation, and under a
   pointer?** If it only works on white, or only when nothing is behind it, it
   is not finished.

### 16.2 Tokens

If a value appears three times and means the same thing each time, it is a
token. If it appears three times and means something different each time, three
different things were given the same number by accident.

### 16.3 Definition of done

A change is done when:

- [ ] `build.py`, `check.py` and `build.py --check` all pass.
- [ ] It is documented in `REFERENCE.md`; `README.md` and this document are
      updated if a principle or the component list changed.
- [ ] It renders correctly in **light and dark**, with and without `niveus.js`.
- [ ] Every interaction state exists and is reachable by keyboard.
- [ ] Translucent surfaces have a solid fallback.
- [ ] It respects reduced motion and reduced transparency.
- [ ] It was seen in a browser, and interactive parts were exercised.
- [ ] It adds no unlisted class, literal value or `!important`.

### 16.4 Deprecation

Do not delete a documented name silently. Mark it deprecated in `REFERENCE.md`
for at least one release, state its replacement, then remove it from the CSS and
the reference together.

---

## 17. Anti-patterns

| Anti-pattern | Why it fails | Instead |
| ------------ | ------------ | ------- |
| Glass on everything | Translucency stops meaning "floats"; cost and tint everywhere | Solid by default; glass for chrome |
| Glaze over a flat background | Reads as a grey film; the effect is invisible | Put it over a bed, imagery or gradient |
| Body copy on clear glass | Contrast collapses on busy backdrops | Solid surface, or floor the frost |
| Stacked translucent layers | Blur and tint compound | One translucent layer |
| Raw hex, `px` shadows, literal `ms` | Restates the language; bypasses theme and reduced motion | Tokens |
| A new shadow "just here" | Off-scale shadow means nothing | Pick an elevation |
| `!important` or selector escalation | The layer system already gives you precedence | Unlayered application CSS |
| Animating everything | Busy interfaces read as unclear | Animate what explains |
| Colour as the only state signal | Fails colour-blind and low-vision users | Add shape, text or attribute |
| Re-defining hover/press/focus per variant | Variants drift from the system | Reassign `--_*` properties |
| Icon button with no `aria-label` | No accessible name | Add it |
| Inventing a class that "should" exist | Documented API is the contract | Check `REFERENCE.md`; propose it |
| Hand-editing `dist/` | Next build erases it; check fails | Edit sources, rebuild |
| Weakening a check to pass | Hides a real defect | Fix the cause or report it |
| Naming a feature after another vendor's mark | Legal and brand risk | Name it for its role |

---

## 18. Compliance checklist

Use this for review, human or automated. Every line is a yes/no.

**Material and depth**
- [ ] Each surface has exactly one material, chosen by what it does.
- [ ] No translucent surface holds body copy or forms.
- [ ] Translucent surfaces have colour behind them and a solid fallback.
- [ ] Every shadow is on the elevation scale.

**Colour and theme**
- [ ] No literal colours; roles only; no `--nv-palette-*`.
- [ ] Looks correct in light and dark, and with a different `--nv-brand`.
- [ ] Text contrast ≥ 4.5:1 (3:1 for large text and UI components), including
      on translucent materials at their worst-case backdrop.

**Interaction and motion**
- [ ] All states exist; hover is behind `@media (hover: hover)`.
- [ ] Targets ≥ 44px; focus visible; full keyboard operation.
- [ ] Durations and easings are tokens; reduced motion honoured.
- [ ] Nothing depends on `niveus.js` to be readable or operable.

**Code and docs**
- [ ] `nv-` naming, BEM, `--_` privates, logical properties.
- [ ] No `!important`; application CSS is unlayered.
- [ ] `REFERENCE.md` updated; `dist/` rebuilt, not hand-edited.
- [ ] `build.py`, `check.py`, `build.py --check` pass.
- [ ] Seen in a browser; interactive parts exercised.

---

*Niveus Design Guidelines 1.0. Maintained with the system: change the rules and
the code in the same commit, or neither.*
