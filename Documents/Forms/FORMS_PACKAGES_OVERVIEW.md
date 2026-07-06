# Forms Packages Overview

This document explains the full `apps/forms/packages` workspace and how to use it to build the Forms section end-to-end.

## 1) What is `apps/forms/packages`?

`apps/forms/packages` is a monorepo-style package workspace that contains the UI system used by the Forms platform.

It is split into focused packages:

- `react` -> React components (`@heroui/react`)
- `styles` -> CSS/theme/tokens (`@heroui/styles`)
- `storybook` -> visual playground and documentation (`@heroui/storybook`)
- `standard` -> shared standards/lint conventions (`@heroui/standard`)
- `vitest` -> shared testing utilities/config (`@heroui/vitest`)

The architecture is layered:

1. `styles` defines the design tokens, themes, and CSS contract.
2. `react` builds components on top of that style system.
3. `storybook` documents and validates components visually.
4. `vitest` supports test reporting/testing workflows.
5. `standard` keeps code style and quality consistent.

## 2) Package-by-package explanation

## 2.1 `packages/react` (`@heroui/react`)

Role:
- Main React UI library for building Forms pages and interactions.

Key metadata:
- Name: `@heroui/react`
- Version: `3.0.3`
- Module type: ESM (`"type": "module"`)
- Exposes `./styles` entrypoint (`src/styles.css`)

Core scripts:
- `dev`: run Rollup in watch mode
- `build`: production build with TypeScript emit
- `build:fast`: faster build path
- `add:component`: scaffold a new component
- `lint`: lint the package
- `typecheck`: TypeScript checks

Key dependencies:
- Internal: `@heroui/styles`
- UI/behavior: `react-aria-components`, `input-otp`, `tailwind-variants`, `tailwind-merge`

Typical structure:
- `src/components/*` -> component folders
- `src/index.ts` -> public exports
- `src/styles.css` -> style entry
- `scripts/*` -> build/component tooling

## 2.2 `packages/styles` (`@heroui/styles`)

Role:
- Design-system foundation (CSS + theme tokens + Tailwind-friendly styles).

Key metadata:
- Name: `@heroui/styles`
- Version: `3.0.3`
- Module type: ESM
- CSS entrypoint: `index.css`

Core scripts:
- `build`: build package outputs
- `dev`: Rollup watch mode
- `measure-size`: bundle size analysis
- `clean`: clean dist/cache artifacts
- `typecheck`: TypeScript checks

Exports:
- Root export (`.`) for style API
- `./css` for direct CSS import
- `./components/*` for per-component style entrypoints

What it contains:
- `components/` CSS files
- `themes/default/` and shared theme rules
- utility CSS and variables
- tokens for spacing, colors, radius, focus, shadows, field styling

## 2.3 `packages/storybook` (`@heroui/storybook`)

Role:
- Local component documentation and visual QA environment.

Key metadata:
- Name: `@heroui/storybook`
- Private package (not meant for public publishing)

Core scripts:
- `dev`: run Storybook on `127.0.0.1:6006`
- `build`: static Storybook build
- `start`: start Storybook
- `lint` / `typecheck`

Internal package usage:
- Depends on `@heroui/react` and `@heroui/styles` via workspace links.

Primary use in Forms build:
- Preview every component state before integrating in real Forms screens.
- Validate accessibility and visual consistency quickly.

## 2.4 `packages/standard` (`@heroui/standard`)

Role:
- Centralized standards package for linting/style conventions.

Key metadata:
- Name: `@heroui/standard`
- Private package
- Description: standardized code style and lint rules

Usage:
- Referenced as dev dependency in other packages to keep tooling aligned.

## 2.5 `packages/vitest` (`@heroui/vitest`)

Role:
- Shared testing support utilities and report-processing scripts.

Key metadata:
- Name: `@heroui/vitest`
- Private package
- ESM package

Core scripts:
- `collect-json-reports`: collect test JSON outputs
- `merge-json-reports`: merge coverage output (`nyc merge`)

Testing stack helpers:
- `@testing-library/react`
- `@testing-library/user-event`
- `@testing-library/jest-dom`

## 3) Component catalog currently exported by `@heroui/react`

The following are exported from `packages/react/src/components/index.ts`.

Foundation and layout:
- `surface`, `skeleton`, `spinner`, `scroll-shadow`, `separator`, `header`, `empty-state`

Buttons and actions:
- `button`, `button-group`, `toggle-button`, `toggle-button-group`, `close-button`

Text and form primitives:
- `input`, `input-group`, `textarea`, `textfield`, `search-field`
- `label`, `description`, `field-error`, `error-message`
- `form`, `fieldset`

Selection and controls:
- `checkbox`, `checkbox-group`
- `radio`, `radio-group`
- `switch`, `switch-group`
- `select`, `combo-box`, `list-box`, `list-box-item`, `list-box-section`
- `slider`, `number-field`

Date and time:
- `date-field`, `date-picker`, `date-range-picker`, `time-field`
- In progress: `calendar`, `calendar-year-picker`, `range-calendar`

Navigation and overlays:
- `dropdown`, `menu`, `menu-item`, `menu-section`
- `popover`, `modal`, `drawer`, `tooltip`
- `tabs`, `breadcrumbs`, `pagination`, `toolbar`, `link`

Status and feedback:
- `alert`, `alert-dialog`, `toast`
- `progress-bar`, `progress-circle`, `meter`
- `badge`, `chip`, `tag`, `tag-group`, `kbd`

Color tools:
- `color-area`, `color-field`, `color-picker`
- `color-slider`, `color-swatch`, `color-swatch-picker`

Data and display:
- `table`, `card`, `avatar`, `text`, `accordion`, `disclosure`, `disclosure-group`, `input-otp`

Also exported:
- `icons`
- `rac` (React Aria related exports)

## 4) How to use this workspace to build the Forms section

Recommended flow:

1. Design foundation first in `styles`
   - Confirm tokens for form fields, states, spacing, colors.
2. Build and adjust components in `react`
   - Reuse existing components before creating new ones.
   - Use `add:component` script for consistent scaffolding.
3. Validate visually in `storybook`
   - Build Stories for empty/loading/error/success/disabled states.
4. Add tests with vitest/testing-library patterns
   - Focus on accessibility + interaction + form validation behavior.
5. Keep standards aligned
   - Run lint/typecheck and follow shared `standard` conventions.

## 5) Suggested Forms implementation mapping

Use current components for Forms features:

- Form builder controls:
  - `input`, `textarea`, `select`, `checkbox-group`, `radio-group`, `switch`, `date-picker`, `time-field`, `input-otp`
- Builder UX and editing:
  - `tabs`, `accordion`, `disclosure-group`, `popover`, `modal`, `drawer`
- Navigation and structure:
  - `breadcrumbs`, `pagination`, `toolbar`
- Feedback and status:
  - `alert`, `toast`, `progress-bar`, `spinner`, `skeleton`, `empty-state`
- Data listing/entries:
  - `table`, `list-box`, `tag-group`, `chip`

## 6) Practical notes

- `@heroui/react` depends on `@heroui/styles`, so keep both in sync.
- If you import full styles, use the package entrypoint; if you need optimization, import component CSS selectively.
- Use Storybook as the source of truth for UI behavior and state coverage.
- Components marked "in progress" should be validated before relying on them in critical Forms flows.

## 7) Quick start commands (from relevant package directory)

`react`:
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`

`styles`:
- `npm run dev`
- `npm run build`
- `npm run typecheck`

`storybook`:
- `npm run dev`
- `npm run build`

`vitest`:
- `npm run collect-json-reports`
- `npm run merge-json-reports`

---

If needed, create a second companion document for your team:
- Forms component usage rules (when to use each component)
- UI states checklist for QA (empty/loading/error/success/disabled/read-only)
- accessibility checklist per component type
