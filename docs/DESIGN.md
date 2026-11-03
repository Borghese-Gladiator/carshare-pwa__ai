---
name: Serene Mobility
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#424656'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#727687'
  outline-variant: '#c2c6d8'
  surface-tint: '#0054d6'
  primary: '#0050cb'
  on-primary: '#ffffff'
  primary-container: '#0066ff'
  on-primary-container: '#f8f7ff'
  inverse-primary: '#b3c5ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#7f4f00'
  on-tertiary: '#ffffff'
  tertiary-container: '#a06500'
  on-tertiary-container: '#fff7f1'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae1ff'
  primary-fixed-dim: '#b3c5ff'
  on-primary-fixed: '#001849'
  on-primary-fixed-variant: '#003fa4'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  margin-mobile: 16px
  margin-desktop: 64px
  gutter: 16px
---

## Brand & Style
The design system is centered on a "Calm & Capable" philosophy, specifically tailored for a shared car ecosystem where trust and ease of use are paramount. The visual language blends Modern Minimalism with a tactile, soft-layered approach to ensure the interface feels approachable rather than clinical.

The target audience consists of urban commuters and eco-conscious travelers who value efficiency and transparency. By utilizing generous whitespace and a "soft-edge" aesthetic, the system reduces cognitive load during high-context tasks like vehicle location or trip management. The emotional response should be one of reliability and quiet confidence.

## Colors
The palette is rooted in functional clarity. 
- **Primary (Soft Blue):** Used for primary actions, active states, and branding elements. It represents the "Path Ahead."
- **Secondary (Mint Green):** Reserved exclusively for 'Available' vehicle status and 'Success' states, reinforcing a positive, "ready-to-go" sentiment.
- **Tertiary (Warm Amber):** High-visibility tone for 'Needs Attention' notifications, low fuel warnings, or upcoming reservation reminders.
- **Neutrals (Slate/Gray):** A sophisticated range of slates (Slate-50 to Slate-900) provides the structural foundation, ensuring high legibility and a premium feel.

## Typography
This design system utilizes **Inter** for its exceptional legibility and systematic weight distribution. 
- **Hierarchy:** Use `display-lg` sparingly for empty states or welcome screens. `headline-lg` is the standard for page headers.
- **Weights:** Medium (500) is used for body text to maintain accessibility against soft backgrounds, while Semi-Bold (600) and Bold (700) are reserved for clear structural emphasis.
- **Mobile scaling:** On mobile devices, large headlines scale down to ensure content remains above the fold, while body text remains at 16px to ensure comfortable touch-target alignment.

## Layout & Spacing
The layout follows a **Fluid Grid** model with a mobile-first priority. 
- **Mobile:** Uses a 4-column grid with 16px side margins and 16px gutters. Components like Status Cards should span the full width of the grid minus margins.
- **Desktop:** Transitions to a 12-column centered layout with a max-width of 1280px.
- **Rhythm:** An 8pt linear scale governs all padding and margins to ensure visual harmony. Use `md` (16px) as the default internal padding for containers and `lg` (24px) for vertical separation between sections.

## Elevation & Depth
This design system uses **Ambient Shadows** and **Tonal Layers** to establish hierarchy.
- **Level 0 (Surface):** The background (Slate-50) is the lowest point of the UI.
- **Level 1 (Cards):** Standard cards use a white background with a very soft, diffused shadow: `0px 4px 20px rgba(100, 116, 139, 0.08)`.
- **Level 2 (Active/Floating):** Elements like the Bottom Navigation Bar use a more pronounced shadow to indicate they float above content: `0px -2px 15px rgba(0, 0, 0, 0.05)`.
- **Level 3 (Modals):** High elevation with a backdrop blur (12px) to focus user attention.

## Shapes
The shape language is defined by a consistent **Rounded (2xl)** profile. 
- **Large Components:** Status cards, vehicle images, and modals utilize the `rounded-2xl` (1.5rem) setting to evoke a friendly and safe atmosphere.
- **Small Components:** Buttons and input fields use `rounded-lg` (1rem) for a cohesive but slightly more structured look.
- **Interactive Elements:** Buttons never use sharp corners, ensuring they feel "touch-friendly" in a mobile environment.

## Components
- **Large Status Cards:** These are the primary dashboard elements. They must include a `rounded-2xl` container, a high-contrast status badge in the top-right, and a clear primary action button at the bottom.
- **Bottom Navigation Bar:** A fixed persistent element. Icons should be 24px with active states highlighted using the Primary Blue and a subtle 4px top indicator bar.
- **Avatar Chips:** Used for driver profiles or "Shared With" lists. These are circular (pill-shaped) with a 2px border in Slate-200. Pair with a `label-md` for the name.
- **Timeline Lists:** Used for trip history. Use a vertical 2px Slate-200 line connecting circular nodes. Active/current nodes use the Secondary Green; past nodes use Slate-400.
- **Buttons:** Primary buttons use a solid Primary Blue background. Secondary buttons use a light Slate-100 background with Slate-900 text. All buttons have a minimum height of 48px for mobile accessibility.
- **Status Badges:** Use high-contrast color pairings (e.g., White text on Green-600 background) with `rounded-pill` geometry to ensure they are glanceable.