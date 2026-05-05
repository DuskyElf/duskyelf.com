# Quartz Core Modifications

This file tracks intentional modifications made to the core Quartz framework files (e.g., `quartz/styles/base.scss`, `quartz/components/*`, etc.). 

Since Quartz is an upstream project, tracking our modifications here makes it much easier to resolve merge conflicts or re-apply custom changes when pulling future Quartz updates.

## [2026-05-05] - Component Redesign and Minimalist Animations
**Commit:** `b34660a`
**Files modified:**
- `quartz/components/Footer.tsx`
- `quartz/components/scripts/darkmode.inline.ts`
- `quartz/components/styles/darkmode.scss`
- `quartz/components/styles/explorer.scss`
- `quartz/components/styles/footer.scss`
- `quartz/components/styles/search.scss`
- `quartz/styles/variables.scss`

**Changes:**
- `Footer.tsx`: Simplified footer output (removed "Created with Quartz" text and version, replaced with generic site footer format).
- `darkmode.inline.ts`: Changed default fallback theme from system preference (`userPref`) to `"light"`.
- `darkmode.scss`: Added smooth scale on hover/active, rotation/fade transitions for icons, and a `fadeIn` keyframe animation for the active icon.
- `explorer.scss`: Added smooth transition effects for hover/color.
- `footer.scss`: Added hover transitions for footer opacity and sliding underline effect for footer links.
- `search.scss`: Added subtle focus-within scale animations, focus outlines, and border-color hover transitions for the search input.
- `variables.scss`: Adjusted breakpoints (`mobile` to `900px`, `desktop` to `1300px`) to better balance grid layout and main content width.

## [2026-05-05] - Clarify Licensing in Footer
**Commit:** `f55f4c5`
**Files modified:**
- `quartz/components/Footer.tsx`

**Changes:**
- `Footer.tsx`: Updated the footer text to explicitly state that code is licensed under MIT and content under CC BY 4.0.

## [2026-05-05] - Sticky Sidebars & Overflow Fix
**Files modified:** 
- `quartz/styles/base.scss`
- `quartz/styles/custom.scss`

**Changes:**
- Changed `overflow-x: hidden;` to `overflow-x: clip;` on `html` (in base.scss) and `body` (in custom.scss) to allow `position: sticky` to function properly.
- Modified `.sidebar` in `base.scss`:
  - Added `flex-direction: column;`
  - Changed `height: 100vh;` to `max-height: 100vh;`
  - Added `overflow-y: auto;`
  - Hid scrollbars natively (using `scrollbar-width: none` and `&::-webkit-scrollbar { display: none; }`).
  - Updated the mobile media query (`@media all and not ($desktop)`) to add `max-height: unset;` (alongside existing `height: unset;`).