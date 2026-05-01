# Unified Design System

## 1. Visual Theme & Atmosphere

This design system combines Together AI's optimistic, high-clarity light mode with Supabase's terminal-native, developer-first dark mode. The result should feel like one product with two intentional lighting conditions rather than two separate brands stitched together.

In **light mode**, the interface follows Together's soft, open composition: a pure white canvas, pastel atmospheric gradients for hero and decorative zones, sharp geometry, and a sense of air between sections. Light mode is where the product feels approachable, editorial, and brand-forward.

In **dark mode**, the interface shifts to Supabase's more disciplined product tone: near-black neutral surfaces, restrained emerald accents, border-led depth, and a denser rhythm. Dark mode is where the product feels technical, focused, and closer to an IDE or terminal experience.

To make both modes feel coherent, typography, spacing, component sizing, and interaction patterns are unified across modes:
- One shared spacing and sizing scale
- One shared typography hierarchy
- One shared button structure
- One shared radius system
- Mode-specific color and elevation behavior only

**Core personality:**
- Light mode = calm, bright, optimistic, lightly expressive
- Dark mode = precise, technical, disciplined, high-focus
- Shared product feel = premium developer tooling with polished marketing sensibility

---

## 2. Color Palette & Roles

### 2.1 Brand and Accent Strategy
This merged system separates **brand expression** from **UI accent behavior**:

- **Pastel gradient system** from Together is used in light mode for hero art, atmosphere, and non-functional decoration
- **Emerald green system** from Supabase is used as the primary functional accent in dark mode and as the shared interactive accent across both modes when clear action/state signaling is needed
- Together's magenta/orange remain decorative only and must not become everyday button or border colors

### 2.2 Shared Semantic Tokens

#### Functional Accent
- **Accent / Primary**: `#3ecf8e`
- **Accent / Interactive**: `#00c573`
- **Accent / Border Strong**: `rgba(62, 207, 142, 0.3)`

Use these for:
- links
- active states
- selected tabs
- focus rings / accent borders
- positive status

Do not use them as large surface fills except in tightly controlled CTA states.

#### Decorative Brand Colors
- **Decorative Magenta**: `#ef2cc1`
- **Decorative Orange**: `#fc4c02`
- **Decorative Lavender**: `#bdbbff`

Use only for:
- hero gradients
- illustrations
- background atmospheric shapes
- editorial highlight moments

Do not use these as default button fills, input borders, table states, or navigation chrome.

### 2.3 Light Mode Palette
- **Canvas**: `#ffffff`
- **Surface / Primary**: `#ffffff`
- **Surface / Secondary**: `rgba(0, 0, 0, 0.02)`
- **Surface / Tinted**: `rgba(0, 0, 0, 0.04)`
- **Text / Primary**: `#000000`
- **Text / Secondary**: `rgba(0, 0, 0, 0.66)`
- **Text / Muted**: `rgba(0, 0, 0, 0.5)`
- **Border / Default**: `rgba(0, 0, 0, 0.08)`
- **Border / Strong**: `rgba(0, 0, 0, 0.14)`
- **Shadow Tint**: `rgba(1, 1, 32, 0.1)`

### 2.4 Dark Mode Palette
- **Canvas**: `#171717`
- **Surface / Primary**: `#171717`
- **Surface / Elevated**: `#0f0f0f`
- **Surface / Overlay**: `rgba(41, 41, 41, 0.84)`
- **Text / Primary**: `#fafafa`
- **Text / Secondary**: `#b4b4b4`
- **Text / Muted**: `#898989`
- **Border / Subtle**: `#242424`
- **Border / Default**: `#2e2e2e`
- **Border / Strong**: `#363636`
- **Border / Stronger**: `#393939`

### 2.5 Mode Behavior
- **Light mode** gets expressive color through gradients and atmosphere, but functional UI stays restrained.
- **Dark mode** gets expressive identity through green accents and border hierarchy, not through broad color washes.
- Semantic states should follow the dark-mode discipline in both modes: concise, clear, and never overly saturated.

---

## 3. Typography Rules

### 3.1 Font Pairing
To avoid fragmenting the identity, use one consistent typographic stack across both modes.

#### Primary Display + UI Font
- **Primary**: `The Future`
- **Fallbacks**: `Inter, Arial, sans-serif`

#### Monospace / Technical Labels
- **Monospace**: `PP Neue Montreal Mono`
- **Fallbacks**: `Source Code Pro, Menlo, monospace`

### 3.2 Typography Decision
Use Together's type voice as the foundation because it is more distinctive and works well on both white and dark surfaces. However, tighten its usage with Supabase-like restraint:
- keep negative tracking on display and headings
- reduce overuse of stylized type in dense UI zones
- reserve monospace labels for technical markers, metadata, or product-specific signposts
- avoid bold-heavy hierarchy; use size and spacing first, weight second

### 3.3 Unified Type Scale

| Role | Font | Size | Weight | Line Height | Letter Spacing | Usage |
|------|------|------|--------|-------------|----------------|-------|
| Display XL | The Future | 64px | 500 | 1.00 | -1.6px | Hero headlines |
| Display L | The Future | 48px | 500 | 1.05 | -1.0px | Large section openers |
| Heading 1 | The Future | 40px | 500 | 1.10 | -0.8px | Section titles |
| Heading 2 | The Future | 28px | 500 | 1.15 | -0.42px | Card groups, feature blocks |
| Heading 3 | The Future | 22px | 500 | 1.20 | -0.22px | Card titles |
| Body L | The Future | 18px | 400 | 1.40 | -0.12px | Intro paragraphs |
| Body | The Future | 16px | 400 | 1.50 | -0.08px | Standard body, nav, button text |
| Body S | The Future | 14px | 400 | 1.45 | normal | Secondary copy |
| Caption | The Future | 12px | 400 | 1.40 | normal | Metadata, helper text |
| Mono Label | PP Neue Montreal Mono | 12px | 500 | 1.20 | 0.8px | Uppercase labels |
| Mono Small | PP Neue Montreal Mono | 10px | 500 | 1.20 | 0.6px | Tags, micro labels |

### 3.4 Typography Principles
- Display text can be dense and cinematic, but body copy should be more relaxed than Together's original system.
- Use 500 for headings and key actions, 400 for almost everything else.
- Do not use 700+ weights.
- Negative tracking belongs to display and heading styles, not long-form paragraphs.
- Monospace labels should feel intentional and sparse.

---

## 4. Component Stylings

### 4.1 Radius System
This system standardizes radius across both modes instead of preserving Together's fully sharp geometry and Supabase's CTA pills as separate rules.

- **Small**: 6px — inputs, small buttons, chips, compact controls
- **Medium**: 8px — cards, panels, dropdowns, modals
- **Large**: 12px — prominent containers, feature cards
- **Pill**: 9999px — reserved for primary CTA, segmented controls, active pills

### 4.2 Button System
Use one structural button system across both modes, with color treatment adapting by mode.

#### Button Sizes
| Size | Height | Padding | Font |
|------|--------|---------|------|
| Small | 32px | 0 12px | 14px |
| Medium | 40px | 0 16px | 16px |
| Large | 48px | 0 20px | 16px |

#### Primary Button
**Shared structure**
- Weight: 500
- Radius: 9999px for high-priority CTA, 8px for standard product actions
- Border: 1px solid transparent

**Light mode**
- Background: `#010120`
- Text: `#ffffff`
- Hover: slightly lighter surface or elevated shadow
- Shadow: `rgba(1, 1, 32, 0.1) 0px 4px 10px`

**Dark mode**
- Background: `#0f0f0f`
- Text: `#fafafa`
- Border: `1px solid #fafafa` or accent border for emphasis
- Shadow: none by default

#### Secondary Button
**Shared structure**
- Radius: 8px
- Border: visible
- Background: transparent or subtle surface tint

**Light mode**
- Border: `1px solid rgba(0,0,0,0.08)`
- Text: `#000000`
- Background: `transparent`

**Dark mode**
- Border: `1px solid #2e2e2e`
- Text: `#fafafa`
- Background: `#0f0f0f`

#### Ghost Button
- Radius: 6px
- Minimal padding
- No strong fill
- Used for tertiary actions, icon controls, in-card actions

### 4.3 Cards & Containers
#### Light mode
- Background: white or very subtle tinted surface
- Border: `1px solid rgba(0, 0, 0, 0.08)`
- Radius: 8px or 12px
- Shadow: light, blue-tinted, used sparingly

#### Dark mode
- Background: `#171717` or `#0f0f0f`
- Border: `1px solid #2e2e2e`
- Radius: 8px or 12px
- Shadow: avoid; use border hierarchy instead

### 4.4 Inputs
- Height: 40px standard
- Radius: 8px
- Text size: 16px
- Border-led states in both modes
- Focus state uses accent border / ring, not exaggerated glow

### 4.5 Tags / Badges
- Use mono label style sparingly
- Radius: 6px
- Compact padding: 2px 8px or 4px 10px
- Light mode background: `rgba(0,0,0,0.04)`
- Dark mode background: `rgba(255,255,255,0.08)` or dark elevated surface

### 4.6 Navigation
- Shared layout and sizing across both modes
- Nav text: 16px, weight 400
- Primary nav CTA may use pill styling
- Light mode nav can be transparent or white-backed
- Dark mode nav should visually blend into the page canvas

### 4.7 Links
- Default interactive link color: `#00c573`
- On light mode, only use this green when the link is clearly actionable or important
- For standard editorial links on light surfaces, black text with subtle underline/hover can be used

---

## 5. Layout Principles

### 5.1 Spacing System
- Base unit: 8px
- Full scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 120

### 5.2 Containers
- Max content width: 1200px
- Inner content should align to one consistent grid regardless of mode
- Full-width atmospheric sections are allowed, but actual text/content rails should remain consistent

### 5.3 Section Rhythm
- Light sections: more breathing room, generally 80–120px vertical spacing
- Dark sections: slightly denser, generally 64–96px vertical spacing
- Within cards and modules, keep padding consistent across modes

### 5.4 Grid Strategy
- Mobile-first
- Single column on narrow screens
- 2-column grids begin at tablet widths
- 3–4 column layouts reserved for desktop

### 5.5 Visual Hierarchy
- Light mode hierarchy comes from whitespace, gradients, and contrast blocks
- Dark mode hierarchy comes from border contrast, surface stacking, and sparse accent usage
- Both modes must share the same alignment discipline and typography scale

---

## 6. Depth & Elevation

| Level | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| Level 0 | Flat white canvas | Flat `#171717` canvas | page background |
| Level 1 | Border + subtle tint | Border `#2e2e2e` | standard cards, inputs |
| Level 2 | Blue-tinted shadow + border | Stronger border `#363636` | elevated cards, hover states |
| Level 3 | Strong contrast panel | Accent border `rgba(62, 207, 142, 0.3)` | featured modules, active state |

### Elevation Rules
- Light mode can use Together-style blue-tinted shadows, but only for emphasis.
- Dark mode should continue Supabase's no-shadow philosophy.
- Hover states should feel tighter in dark mode and softer in light mode.

---

## 7. Responsive Behavior

### Breakpoints
| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | <480px | Single column, stacked CTAs |
| Large Mobile | 480–767px | Spacious single column, simplified nav |
| Tablet | 768–991px | 2-column layouts begin |
| Desktop | 992px+ | Full layout, richer section composition |

### Responsive Rules
- Hero display scales from 64px down to 40px then 28px
- Buttons stack vertically on narrow screens when paired
- Stats bars and card rows collapse into vertical stacks
- Decorative gradients must stay atmospheric and never block readability
- Dark mode borders must remain visible on all breakpoints

---

## 8. Do's and Don'ts

### Do
- Use Together's white-canvas openness in light mode
- Use Supabase's dark neutral discipline in dark mode
- Keep one shared component sizing system across both modes
- Use The Future + mono labels consistently
- Reserve pills for high-priority CTA moments and selected controls
- Use green as the shared functional interactive accent
- Keep decorative gradients separate from functional UI
- Let dark mode depth come from borders, not shadows

### Don't
- Don't mix sharp-only and pill-only rules randomly by section
- Don't use magenta/orange as standard UI action colors
- Don't turn dark mode into midnight blue if the chosen dark reference is Supabase
- Don't over-style body text with aggressive tracking
- Don't use heavy shadows in dark mode
- Don't introduce a third radius language beyond 6/8/12/pill
- Don't let light mode become too playful for product UI or dark mode too sterile for marketing sections

---

## 9. Implementation Guidance

### Best use of the hybrid system
- **Marketing / landing pages**: light-mode hero and editorial sections can lean more toward Together
- **Docs / dashboards / product surfaces**: dark mode can lean more toward Supabase
- **Shared components**: buttons, forms, cards, nav, tabs, badges must look like one family with mode-specific skinning only

### Recommended defaults
- Typography: Together-led
- Dark palette: Supabase-led
- Light palette: Together-led
- Functional accent: Supabase green
- Decorative accent: Together pastel gradient family
- Radius: merged system (6 / 8 / 12 / pill)
- Button sizing: unified medium-first system

### Agent prompt shortcut
- "Use white, airy Together-style light sections and Supabase-style dark sections. Keep typography in The Future with restrained negative tracking, use PP Neue Montreal Mono for small uppercase labels, use emerald green as the functional interactive accent, decorative pastel gradients only in light-mode atmosphere, border-led dark-mode depth, unified 6/8/12/pill radius system, and shared button heights of 32/40/48."
