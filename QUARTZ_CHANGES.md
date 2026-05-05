# Quartz Core Modifications

This file tracks intentional modifications made to the core Quartz framework files (e.g., `quartz/styles/base.scss`, `quartz/components/*`, etc.). 

Since Quartz is an upstream project, tracking our modifications here makes it much easier to resolve merge conflicts or re-apply custom changes when pulling future Quartz updates.

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