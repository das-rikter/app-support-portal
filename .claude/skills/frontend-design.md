# Frontend Design

You are performing a **frontend design pass** on this Next.js application. Your goal is to produce a polished, production-quality UI that is consistent, accessible, and on-brand.

This skill orchestrates two things:
1. Apply the **DasTech design system** (tokens, colours, typography - see `.claude/skills/das-design-system.md`)
2. Apply **general frontend design principles** (layout, hierarchy, spacing, component patterns)

---

## Process

### Step 1 - Audit before touching anything

Read every file you intend to change. For each component or page, identify:
- Hardcoded hex values or non-DasTech colour strings
- Generic Tailwind colours (`blue-500`, `green-600`, `gray-*`) that should be DasTech tokens
- Inconsistent spacing, padding, or radius values
- Missing hover / focus / active states on interactive elements
- Poor visual hierarchy (everything the same weight / size)
- Missing loading and error states
- Accessibility gaps (missing `aria-*`, low contrast, no focus ring)

### Step 2 - Apply DasTech tokens

Follow `.claude/skills/das-design-system.md` strictly:
- Replace all hardcoded colours with DasTech token classes
- Use semantic aliases first (`bg-primary`, `text-muted-foreground`) before raw palette tokens
- Use campaign status token pairs for every status badge
- No inline `style={{}}` props for colours, spacing, or typography

### Step 3 - Apply design principles (see below)

Work through each principle and apply it to every component in scope.

### Step 4 - Verify the checklist

Before finishing, run through the DasTech checklist and the design principles checklist at the bottom of this skill.

---

## Design Principles

### Visual Hierarchy
- Page title: `text-2xl font-bold tracking-tight text-foreground`
- Section heading: `text-lg font-semibold text-foreground`
- Card title: `text-base font-semibold text-foreground` (via `CardTitle`)
- Body copy: `text-sm text-foreground`
- Secondary / helper text: `text-sm text-muted-foreground`
- Captions, timestamps, metadata: `text-xs text-muted-foreground`
- Monospaced IDs / SIDs / codes: `font-mono text-xs text-muted-foreground`

### Spacing & Rhythm
- Page-level vertical stack: `space-y-6`
- Card internal padding: handled by `CardContent` - add `pt-6` when there's no `CardHeader`
- Form field groups: `space-y-1.5` between label and input
- Toolbar / filter rows: `flex gap-3`
- Section gaps inside a card: `divide-y divide-border` for definition lists, `space-y-3` for lists

### Cards
- Use `Card` > `CardHeader` > `CardTitle` + `CardDescription` > `CardContent` structure
- Cards get `shadow-xs` automatically via the ShadCN `card` class - don't add extra shadow unless elevating further
- Never use raw `div` with `border rounded-lg` when a `Card` component exists

### Tables
- Header row background: `bg-primary-shuttle-gray-900` with `text-txt-neutral-100`
- Data rows: default `bg-card`; hover `hover:bg-secondary-background-100`
- Clickable rows need `cursor-pointer`
- Truncate long cell content with `max-w-[...] truncate` rather than wrapping
- SID / ID cells: `font-mono text-xs text-muted-foreground`
- Wrap table in `rounded-lg border border-border overflow-hidden`

### Buttons
- Primary CTA: `variant="default"` (Clementine fill)
- Secondary / toolbar actions: `variant="outline"`
- Destructive: `variant="destructive"`
- Icon-only: `variant="ghost" size="icon"` with an `aria-label`
- Text + icon buttons: icon on the left at `h-4 w-4`, gap `gap-1.5`
- Spinning loader icon during async operations: `className={isFetching ? 'animate-spin' : ''}`

### Inputs & Selects
- Always pair with a `Label` component (even if visually hidden via `sr-only`)
- Icon-in-input: position the icon `absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none` and add `pl-9` to the Input
- Full-width on mobile, fixed width on desktop for selects: `w-full sm:w-48`

### Badges & Status
- Always use `CampaignStatusBadge` for campaign statuses - never roll a custom inline badge
- For non-campaign badges (tags, labels): use `<Badge variant="...">` from `components/ui/badge.tsx`
- `rounded-full` for pill badges, `rounded-md` for tag-style badges

### Empty & Error States
- Empty table: full-width `TableCell` with `h-32 text-center text-muted-foreground`
- Error panels: `rounded-lg border border-bdr-alert-error bg-status-error-bg p-6 text-center`
  - Primary message: `text-sm font-medium text-status-error`
  - Detail: `text-xs text-muted-foreground mt-1`
- Not-found: same pattern but with neutral border and muted text

### Loading / Skeleton States
- Use the `Skeleton` component (`<Skeleton className="h-4 w-32" />`) for every piece of content that loads async
- Match the skeleton dimensions to the expected content (wide for names, narrow for dates)
- Table loading: render full skeleton rows matching the real column count
- Card loading: render skeletons for the title, description, and each detail row

### Focus & Accessibility
- All interactive elements must have a visible focus ring - ShadCN components do this via `ring-ring` automatically
- Icon-only buttons must have `aria-label`
- Form inputs must have associated labels
- Sort buttons must convey state - use `aria-sort` or include the icon direction change
- Colour is never the sole indicator of status - always pair with a text label inside badges

### Header & Navigation
- Sticky header: `sticky top-0 z-50`
- Background: `bg-primary-shuttle-gray-900`
- Logo / app name: `text-txt-neutral-100 font-semibold`
- User info (secondary): `text-txt-neutral-100 text-xs`
- Sign-out: `variant="ghost"` with `text-txt-neutral-100 hover:text-foreground`

### Login Page
- Full-screen centered layout: `flex min-h-screen items-center justify-center`
- Background: `bg-primary-shuttle-gray-900`
- Card: `rounded-xl border border-border bg-card p-8 shadow-sm`
- Microsoft SSO button keeps Microsoft brand colours (`#0052CC` / `#0047B3`) - this is an authorised exception to the no-hardcoded-hex rule

### Responsive Design
- Mobile-first: stack vertically by default, `sm:flex-row` for wider layouts
- Hide secondary text on mobile: `hidden sm:block` / `hidden md:flex`
- Pagination and filter controls must be usable at 375px width

---

## What NOT to do
- Do not add `dark:` variants - the dark mode stub in `globals.css` is empty; don't implement it unless explicitly asked
- Do not add animations beyond what the design system defines (`animate-shimmer`, `animate-pulse`, accordion animations)
- Do not change component structure or business logic - this is a styling pass only
- Do not edit files in `components/ui/` beyond fixing DasTech token violations (don't restructure ShadCN primitives)
- Do not add new dependencies

---

## Final Checklist

Before declaring the pass complete, verify every changed file against:

- [ ] No hardcoded hex values (exception: Microsoft SSO button)
- [ ] No generic Tailwind colours (`blue-*`, `green-*`, `gray-*`, `red-*`)
- [ ] All campaign statuses use `text-status-*` / `bg-status-*-bg` token pairs via `CampaignStatusBadge`
- [ ] All interactive elements have hover and focus states
- [ ] All icon-only buttons have `aria-label`
- [ ] Loading states have skeleton placeholders matching content dimensions
- [ ] Error states use `border-bdr-alert-error bg-status-error-bg text-status-error`
- [ ] Table header uses `bg-primary-shuttle-gray-900 text-txt-neutral-100`
- [ ] Table row hover uses `hover:bg-secondary-background-100`
- [ ] Font is Satoshi (automatic via `body` - no override needed unless deliberate)
- [ ] Spacing follows the rhythm guidelines above
- [ ] Visual hierarchy is clear: page title > section heading > body > secondary > caption
