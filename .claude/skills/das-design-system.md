# DasTech Design System

You are applying the **DasTech design system** to this Next.js application. All tokens are defined as CSS custom properties in `app/globals.css` and surfaced as Tailwind utility classes via `@theme` / `@theme inline` blocks. Use Tailwind utility classes exclusively - no inline styles, no CSS modules.

---

## Font

The brand font is **Satoshi** (variable font). It is already registered in `globals.css` and set as the default `font-sans`.

```tsx
// Default - applied automatically via `body { font-satoshi }`
// Explicit override if needed:
<p className="font-satoshi">...</p>
```

Weight utilities: `font-light` (300), `font-normal` (400), `font-medium` (500), `font-bold` (700), `font-black` (900).

---

## Colour Palette

All colours are available as Tailwind classes in the form `bg-*`, `text-*`, `border-*`, `ring-*`, etc.

### Primary - Clementine (brand orange)

| Token | Tailwind class | Hex |
|---|---|---|
| Base / 900 | `primary-clementine-900` | `#dd6000` |
| 800 | `primary-clementine-800` | `#e0701a` |
| 700 | `primary-clementine-700` | `#e48033` |
| 600 | `primary-clementine-600` | `#e7904d` |
| 500 | `primary-clementine-500` | `#eba066` |
| 400 | `primary-clementine-400` | `#eeaf80` |
| 300 | `primary-clementine-300` | `#f1bf99` |
| 200 | `primary-clementine-200` | `#f5cfb2` |
| 100 | `primary-clementine-100` | `#f8dfcc` |
| 50  | `primary-clementine-50`  | `#fcefe5` |

The ShadCN `primary` alias maps to Clementine 900. Use `bg-primary` / `text-primary` / `border-primary` for interactive elements and CTAs.

### Primary - Shuttle Gray (neutral)

| Token | Tailwind class | Hex |
|---|---|---|
| 950 | `primary-shuttle-gray-950` | `#667085` |
| 900 | `primary-shuttle-gray-900` | `#54565b` |
| 800 | `primary-shuttle-gray-800` | `#65676b` |
| 700 | `primary-shuttle-gray-700` | `#76787c` |
| 600 | `primary-shuttle-gray-600` | `#87898c` |
| 500 | `primary-shuttle-gray-500` | `#989a9d` |
| 400 | `primary-shuttle-gray-400` | `#a9aaad` |
| 300 | `primary-shuttle-gray-300` | `#bbbbbd` |
| 200 | `primary-shuttle-gray-200` | `#ccccce` |
| 100 | `primary-shuttle-gray-100` | `#ddddde` |

Use for borders (`border-primary-shuttle-gray-300`), subtle text, dividers, and disabled states.

### Primary - Lochmara (blue)

| Token | Tailwind class | Hex |
|---|---|---|
| 900 | `primary-lochmara-900` | `#0096db` |
| 800–100 | `primary-lochmara-{800…100}` | lighter blues |

Use for informational states, links, and the `IN_PROGRESS` campaign status.

### Primary - Vida Loca (green)

| Token | Tailwind class | Hex |
|---|---|---|
| 900 | `primary-vida-loca-900` | `#66bc29` |
| 50  | `primary-vida-loca-50`  | `#f4ffec` |

Use for success states and the `VERIFIED` campaign status.

### Secondary - Buttercup (yellow)

| Token | Tailwind class | Hex |
|---|---|---|
| 900 | `secondary-buttercup-900` | `#f5b324` |
| 100 | `secondary-buttercup-100` | `#fdf0d3` |

Use for warning states and the `PENDING_REVIEW` campaign status.

### Secondary - Ecstacy (amber-orange)

| Token | Tailwind class | Hex |
|---|---|---|
| 900 | `secondary-ecstacy-900` | `#f68c23` |
| 100 | `secondary-ecstacy-100` | `#fde8d3` |

Use for the `SUSPENDED` campaign status.

---

## Semantic Colour Aliases (ShadCN-compatible)

Prefer these aliases over raw palette tokens in UI components:

| Alias | Usage |
|---|---|
| `bg-background` / `text-foreground` | Page background / body text |
| `bg-card` / `text-card-foreground` | Card surfaces |
| `bg-muted` / `text-muted-foreground` | Subtle backgrounds / secondary text |
| `bg-accent` / `text-accent-foreground` | Hover highlights |
| `bg-primary` / `text-primary-foreground` | Primary actions (Clementine) |
| `bg-destructive` / `text-destructive-foreground` | Destructive / error actions |
| `border-border` | Default borders |
| `ring-ring` | Focus rings |

---

## Text Tokens

Fine-grained text colours when semantic aliases are too coarse:

```
text-txt-neutral-{950,900,800,700,600,500,400,300,200,150,100,50}
text-txt-shuttle-grey-{900…100}
text-txt-clementine-{950,900…50}
```

Default body copy: `text-txt-neutral-900` (`#4d4d4d`).
Secondary / helper text: `text-txt-neutral-600` or `text-muted-foreground`.

---

## Background Scale

Light neutral surfaces for layering cards, panels, and hover states:

```
bg-secondary-background-{900,800,700,600,500,400,300,250,200,150,100,50}
```

Common picks:
- `bg-secondary-background-250` - page section backgrounds (`#f9fafb`)
- `bg-secondary-background-100` - table row hover, subtle fills (`#fafafa`)
- `bg-secondary-background-150` - sidebar borders, dividers (`#eaecf0`)

---

## Campaign Status Colours

Pre-mapped tokens for every `CampaignStatus` value. Always use these - never hardcode hex values for statuses.

| Status | Text token | Background token |
|---|---|---|
| `VERIFIED` | `text-status-verified` | `bg-status-verified-bg` |
| `PENDING_REVIEW` | `text-status-pending` | `bg-status-pending-bg` |
| `IN_PROGRESS` | `text-status-in-progress` | `bg-status-in-progress-bg` |
| `FAILED` | `text-status-failed` | `bg-status-failed-bg` |
| `REJECTED` | `text-status-rejected` | `bg-status-rejected-bg` |
| `SUSPENDED` | `text-status-suspended` | `bg-status-suspended-bg` |
| `EXPIRED` | `text-status-expired` | `bg-status-expired-bg` |
| `UNKNOWN` | `text-status-unknown` | `bg-status-unknown-bg` |

Status badge pattern:

```tsx
<span className={cn(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  statusTextClass,   // e.g. "text-status-verified"
  statusBgClass,     // e.g. "bg-status-verified-bg"
)}>
  {status}
</span>
```

---

## Semantic Status (icons / alerts)

| Intent | Icon colour | Background | Border |
|---|---|---|---|
| Error | `text-status-error` / `text-destructive` | `bg-status-error-bg` | `border-bdr-alert-error` |
| Warning | `text-status-warning` | `bg-status-warning-bg` | `border-bdr-alert-warning` |
| Success | `text-status-success` | `bg-status-success-bg` | `border-bdr-alert-success` |
| Brand | `text-primary` | `bg-primary-clementine-50` | `border-bdr-alert-brand` |
| Gray | `text-muted-foreground` | `bg-muted` | `border-bdr-alert-gray` |

---

## Shadows

```
shadow-xs    - subtle card lift
shadow-lg    - elevated dropdowns, modals
shadow-xl    - dialogs, popovers
```

Focus ring shadows (apply via `ring` utilities or directly):
- `shadow-focus-clementine` - for primary / brand interactive elements
- `shadow-focus-neutral` - for neutral inputs

---

## Border Radius

| Alias | Value |
|---|---|
| `rounded-sm` | `calc(0.625rem - 4px)` |
| `rounded-md` | `calc(0.625rem - 2px)` |
| `rounded-lg` | `0.625rem` |
| `rounded-full` | `9999px` - badges, avatars |

---

## Sidebar Tokens

For sidebar / navigation components:

```
bg-sidebar                  sidebar surface
text-sidebar-foreground     sidebar text
bg-sidebar-primary          active nav item bg (Clementine)
text-sidebar-primary-foreground  active nav item text (white)
bg-sidebar-accent           hover state
text-sidebar-accent-foreground
border-sidebar-border       sidebar dividers
ring-sidebar-ring           sidebar focus rings
```

---

## Animations

| Class | Usage |
|---|---|
| `animate-accordion-down` / `animate-accordion-up` | ShadCN Accordion |
| `animate-shimmer` | Skeleton loading states (combine with `.skeleton` utility) |
| `animate-pulse` | Generic pulse skeleton (via `.skeleton` utility class) |

Skeleton utility (already defined in `globals.css`):
```tsx
<div className="skeleton h-4 w-32" />
```

---

## Applying the Design System - Checklist

When styling a component or page, verify:

1. **Font** - body uses `font-satoshi` automatically; override only when needed.
2. **Colours** - use semantic aliases (`bg-primary`, `text-muted-foreground`) first; fall back to palette tokens only when semantics don't fit.
3. **Status badges** - always use `text-status-*` / `bg-status-*-bg` token pairs.
4. **Spacing** - standard Tailwind scale (`p-4`, `gap-6`, etc.) - no custom values unless a token exists.
5. **Radius** - `rounded-md` for inputs/buttons, `rounded-lg` for cards, `rounded-full` for badges/avatars.
6. **Shadows** - `shadow-xs` for cards, `shadow-lg` for elevated panels.
7. **Dark mode** - the `.dark` class block in `globals.css` is a stub; only add overrides there.
8. **No hardcoded hex values** anywhere in component files.
